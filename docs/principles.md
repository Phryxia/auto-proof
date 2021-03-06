# 모델 원칙

모든 수식은 불변객체이다.

## 연산 컨텍스트(OperationContext)

연산 컨텍스트는 새로운 계산트리를 생성하여 반환하기까지의 과정으로, 다음의 정보를 갖는다. (다만 명시적으로 클래스로 제공하지는 않는다)

- 상수 풀(constantPool)
- 변수 풀(variablePool)

아래의 예시들은 하나의 연산 컨텍스트를 갖는다.

- `Parser.parse`로 수식 하나를 파싱하여 새로운 계산트리를 반환
- `optimize`로 수식을 최적화한 결과를 반환
- `differentiate`로 수식을 미분한 결과를 반환

동일한 연산 컨텍스트 과정에서 생성되는 동일한 값의 상수와 동일한 이름의 변수는 모두 동일한 레퍼런스를 갖는다.

## 중복된 상수와 변수

하나의 수식을 파싱하거나 최적화했을 때, 그 수식에서 2회 이상 사용된 상수나 변수는 동일한 객체여야 한다. 예를 들어 `sin(2 * x) * x + 2`는 2개의 `x` 변수와 2개의 `2` 상수를 가지고 있는데, 이것을 해석했을 때 `Variable` 객체 2개, `Constant` 객체 2개가 만들어지는 것이 아니라 각각 1개씩만 만들어져야 한다.

```ts
const expr = Parser.parse('x + x').expression as Add

console.log(expr.expr0 === expr.expr1) // true
```

이 규칙은 다른 연산 컨텍스트 간에는 보장하지 않는다.

```ts
const exprA = Parser.parse('72').expression
const exprB = Parser.parse('72').expression

console.log(exprA === exprB) // false
```

다른 연산 컨텍스트 끼리의 동일성을 보장해주지 않는 이유는, 메모리 누수 가능성이 존재하기 때문이다.

현재는 `parse`를 실행할 때마다 격리된 `Pool`을 생성하도록 구현돼 있다. `parse`가 반환한 `Expression`으로 이루어진 트리는 사용이 끝나면 GC에 의해 수거될 것이고, 그 과정에서 내부적으로 생성한 `Pool` 인스턴스도 같이 수거된다.

그런데 만약 연산 컨텍스트를 넘어서서 동일한 상수/변수를 붙잡고 있으면 무슨 문제가 생길까? 반환한 `Expression`이 사용 종료되어도 상수와 변수는 메모리에 남아있게 된다. 그 상태에서 아래 코드를 실행하면?

```ts
const parser = new Parser()
for (let n = 0; n < 100000; ++n) {
  const { expression } = parser.parse(`${n + 1} * sin(x) + y`)

  // do something with expression, but never store it to outside
}
```

각각의 수식은 `for`문 안에서만 사용되고 수거되어야 하는데, 연산 컨텍스트를 넘어서 상수/변수를 저장하게 되면 100만개의 (앞으로 사용되지 않을) 상수가 메모리에서 수거되지 못하고 존재하게 된다.

특정 변수가 언제 사용 종료될 지 예측하는 것은 결정불가능(Undecidable)한 문제이기 때문에, 별도로 풀을 비우는 함수를 만들어줘야 한다. 이건 무척 어렵고 귀찮은데다가 사용성도 좋지 못하다.

그러나 연산 컨텍스트가 다르다고 모든 상수/변수의 레퍼런스가 다르다는 것은 아니다. `optimize`나 `differentiate`처럼 기존의 컨텍스트를 재활용할 수 있는 경우, 최대한 새로운 객체 생성을 지양한다.

## Trivial Constant

아래의 상수는 연산 컨텍스트와 관계없이 모든 경우에 동일한 레퍼런스를 사용한다.

- `0`: `Constant.ZERO`
- `1`: `Constant.ONE`
- `-1`: `Constant.MINUS_ONE`

얘네는 엄청나게 자주 쓰고 그 수가 적기 때문에 메모리에 문제가 없다.

단, 라이브러리 사용자가 임의로 `new Constant(0)`을 호출하면 별도의 객체가 생성된다. 그것까지는 막지 못하기 때문이다.

# Math-Parser 문법

평범한 수식의 문법이다.

- 연산자 우선순위는 괄호 → 부호연산(`+`, `-`) → 지수연산(`^`) → 곱셈/나눗셈(`*`, `/`) → 덧셈/뺄셈(`+`, `-`) 순이다.
- 지수연산끼리는 오른쪽에서 왼쪽으로 해석한다. (ex:` 2^2^2`는 `2^(2^2)`와 동일하다)
- 나머지 동일한 연산자 간에는 왼쪽에서 오른쪽으로 해석한다.

```ebnf
digit = "0" | "1" | ... | "9"
number_exp_part = "e" ["+" | "-"] {digit}
number = {digit} ["." [{digit} [number_exp_part]]]
       | "." {digit} [number_exp_part]
id = {"a" | "b" | ... | "z" | "A" | "B" | ... | "Z"}

expr = term
     | expr "+" term
term = expo
     | term "*" expo
expo = unit
     | unit "^" expo
unit = ["+" | "-"] leaf
leaf = number
     | id [["_" leaf] leaf]
     | "(" expr ")"
     | "{" expr "}"
     | "[" expr "]"
```

# 파서 원칙

## 경고(warning)

**경고(warning)**는 무시했을 때 해석을 하는데 지장이 없는 경우의 알림이다.

ex) 정의되지 않은 문자의 사용(ex: `#`), 가능한 모든 인식을 끝낸 후 토큰이 남은 경우(ex: `x*y 1`에서 `1`)

## 오류(error)

**오류(error)**는 해석이 불가능한 경우의 알림이다.

ex) non-terminal symbol 인식 도중 예상하지 않은 토큰(ex: `x * (y + )`에서 `)`)

## 공백은 무시하되, 공백에 의해 토큰은 구분된다.

ex) `123 456 x +` => `["123", "456", "x", "+"]`

## 문법에서 정의하지 않은 문자는 무시하며, 경고를 띄운다. 단, 이 문자에 의해 토큰은 구분된다.

ex) `a#b` => `["a", "b"]`

## 동일한 상수와 변수는 하나의 `Constant` 오브젝트를 레퍼런스로 갖는다.

성능 향상을 위해서이다.

# 수식 텍스트 렌더링 원칙

## 계산 트리를 왜곡없이 중위표현식으로 표현한다.

`x + y`와 `y + x`는 다르다. 수학적으로 동등하더라도 계산 트리가 다르기 때문이다.

## 위 항을 위배하지 않는다면 괄호의 사용을 최소화한다.

`explicitParenthesis: true` 옵션으로 괄호 최적화를 제외할 수 있다.

X: `(x * y) + (a + b) - 20`
O: `x * y + a + b - 20`

### 동일한 우선순위의 연산자 간에는 괄호 사용을 하지 않는다.

X: `a * (b * c)`
O: `a * b * c`

물론 괄호를 제거했을 때 의미가 바뀌는 경우는 제외한다. (ex: `a/(b/c)` ≠ `a/b/c`)

### 함수 호출문은 반드시 괄호를 사용한다.

X: `sin x`
O: `sin(x)`

## 불필요한 양의 부호연산은 제거한다.

X: `+(3 * x + 2)`
O: `3 * x + 2`

# 수식 최적화 원칙

최적화의 주된 목적은 계산 트리의 노드 수를 줄이는 것이다. 또한 렌더링 했을 때 사람이 인식하기 쉽게 하기 위함도 있다.

## 모든 최적화는 전후 결과가 수학적으로 동일해야 한다.

참고로 잠재적으로 0이 될 수 있는 식으로 나누는 행위는, 약분한 결과와 다르게 취급한다.

ex) `x / x` ≠ `1`

## 단말노드가 모두 상수(`Constant`)인 서브트리는 하나의 상수로 합친다.

명명된 상수(`NamedConstant`)는 해당사항이 없다.

ex) `2 * (4 + 3)` → `14`

## 계산 트리를 변형하여 위를 실현할 수 있는 경우, 그렇게 한다.

ex) `(2 * x) * (3 + 4)` → `x * (2 * (3 + 4))` → `x * 14`

## 최적화 결과를 렌더링할 때 상수가 가장 앞에 오도록 한다.

ex) `x * (2 + 3) * y + 1` → `1 + 5 * x * y`

## 항등원은 생략한다.

ex) `0 + x` → `x`, `1 * x` → `x`, `x ^ 1` → `x`

## 2회 이상 반복되는 **상수곱을 제외하면 수학적으로 동일한 식**의 덧셈과 뺄셈은 동류항으로 간주하여 통합한다.

ex) `x^2 + 5 * x * x` → `6 * x^2`

## 2회 이상 반복되는 **상수곱을 제외하면 수학적으로 동일한 식**의 곱셈과 나눗셈은, 지수법칙을 적용하여 통합한다.

ex) `5 * x * 2 * x^2` → `10 * x^3`

단, 전체 지수가 양수이면서 잠재적으로 0이 될 수 있는 식으로 나눌 경우, 분모가 반드시 보존되어야 하며 분모의 지수는 1이어야 한다.

ex) `2 * (x + 1) * (x + 1)^3 / (x + 1)` → `2 * (x + 1)^4 / (x + 1)`

## 음의 지수는 분수로 변환한다.

ex) `(x + 1)^{-0.5}` → `1/(x+1)^0.5`

## 인수분해는 최적화 대상이 아니다.

인수분해는 계산 트리의 노드 수를 줄일 수는 있으나, 수학적인 인사이트 도출을 방해할 수 있기 때문에 제외한다.

ex) `a * x + b * x` ≠ `(a + b) * x`

인수분해를 최적화 대상으로 두지 않는 또다른 이유는, 복수의 선택지가 존재할 수 있기 때문이기도 하다. 각각의 선택지가 나비효과처럼 나머지 최적화에 영향을 미치기 때문에, 전체 최적화 과정에 지대한 영향을 미칠 수 있고, 이것을 모두 계산하여 최적을 찾는 것에는 지수복잡도가 소요된다. 대체로 이 작업은 구현만 복잡하게 만들며 큰 의미가 없다.

ex) `a * b + b * c + c * a` → `b * (a + c) + c * a` vs `a * (b + c) + b * c`

## 지수법칙을 최대한 적용할 수 있으면 적용한다.

ex) `((x + 2)^2)^x` → `(x + 2)^(2 * x)`, `e^ln(x)` → `x`
