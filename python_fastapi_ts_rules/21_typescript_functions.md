# TypeScript Functions - Функции

## Общие принципы

- **Типизируйте** параметры и возвращаемые значения
- **Arrow functions** для коротких функций
- **Function declarations** для именованных функций
- **Используйте generics** для универсальных функций

## Function Types

### Function declaration
```typescript
// ✅ ПРАВИЛЬНО - полная типизация
function add(a: number, b: number): number {
  return a + b;
}

function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Void для функций без возврата
function log(message: string): void {
  console.log(message);
}

// ❌ НЕПРАВИЛЬНО - без типов
function add(a, b) {
  return a + b;
}
```

### Function expression
```typescript
// ✅ ПРАВИЛЬНО - типизированная функция
const add = function(a: number, b: number): number {
  return a + b;
};

// С типом функции
const multiply: (a: number, b: number) => number = function(a, b) {
  return a * b;
};
```

### Arrow functions
```typescript
// ✅ ПРАВИЛЬНО - arrow functions
const add = (a: number, b: number): number => {
  return a + b;
};

// Короткая форма
const add = (a: number, b: number): number => a + b;

// Один параметр
const square = (x: number): number => x * x;

// Без параметров
const getRandom = (): number => Math.random();
```

## Optional и Default Parameters

### Optional parameters
```typescript
// ✅ ПРАВИЛЬНО - optional параметры
function greet(name: string, greeting?: string): string {
  return greeting ? `${greeting}, ${name}!` : `Hello, ${name}!`;
}

greet("John"); // "Hello, John!"
greet("John", "Hi"); // "Hi, John!"

// Optional должны быть после обязательных
function createUser(
  name: string,
  email: string,
  age?: number,
  role?: string
): User {
  return { name, email, age, role };
}
```

### Default parameters
```typescript
// ✅ ПРАВИЛЬНО - параметры по умолчанию
function createUser(
  name: string,
  age: number = 18,
  role: string = "user"
): User {
  return { name, age, role };
}

createUser("John"); // age = 18, role = "user"
createUser("John", 25); // age = 25, role = "user"
createUser("John", 25, "admin"); // все параметры
```

## Rest Parameters

### Rest syntax
```typescript
// ✅ ПРАВИЛЬНО - rest параметры
function sum(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

sum(1, 2, 3); // 6
sum(1, 2, 3, 4, 5); // 15

// Rest после обычных параметров
function buildMessage(
  prefix: string,
  ...words: string[]
): string {
  return `${prefix} ${words.join(" ")}`;
}

buildMessage("Hello", "my", "friend"); // "Hello my friend"
```

## Function Overloading

### Overload signatures
```typescript
// ✅ ПРАВИЛЬНО - function overloading
function parse(value: string): string[];
function parse(value: number): number;
function parse(value: boolean): boolean;
function parse(value: string | number | boolean): any {
  if (typeof value === "string") {
    return value.split(",");
  }
  return value;
}

const result1 = parse("a,b,c"); // string[]
const result2 = parse(123); // number
const result3 = parse(true); // boolean

// С разным количеством параметров
function createElement(tag: string): HTMLElement;
function createElement(tag: string, content: string): HTMLElement;
function createElement(tag: string, content?: string): HTMLElement {
  const element = document.createElement(tag);
  if (content) {
    element.textContent = content;
  }
  return element;
}
```

## Generic Functions

### Basic generics
```typescript
// ✅ ПРАВИЛЬНО - универсальные функции
function identity<T>(value: T): T {
  return value;
}

const num = identity<number>(42); // number
const str = identity<string>("hello"); // string
const arr = identity<number[]>([1, 2, 3]); // number[]

// Type inference
const num2 = identity(42); // TypeScript выведет number

// Множественные type parameters
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair<string, number>("age", 30); // [string, number]
const result2 = pair("name", "John"); // Type inference
```

### Generic constraints
```typescript
// ✅ ПРАВИЛЬНО - ограничения на generic типы
interface HasLength {
  length: number;
}

function getLength<T extends HasLength>(item: T): number {
  return item.length;
}

getLength("hello"); // 5
getLength([1, 2, 3]); // 3
getLength({ length: 10 }); // 10
// getLength(123); // Error: number не имеет length

// Constraining to object keys
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "John", age: 30 };
const name = getProperty(user, "name"); // string
const age = getProperty(user, "age"); // number
// getProperty(user, "email"); // Error: email не существует
```

## Higher-Order Functions

### Functions as parameters
```typescript
// ✅ ПРАВИЛЬНО - функции как параметры
function map<T, U>(
  array: T[],
  fn: (item: T, index: number) => U
): U[] {
  return array.map(fn);
}

const numbers = [1, 2, 3, 4];
const doubled = map(numbers, (n) => n * 2); // number[]
const strings = map(numbers, (n) => String(n)); // string[]

// Callback типы
type Callback<T> = (error: Error | null, result?: T) => void;

function fetchData<T>(
  url: string,
  callback: Callback<T>
): void {
  fetch(url)
    .then(res => res.json())
    .then(data => callback(null, data))
    .catch(err => callback(err));
}
```

### Functions as return values
```typescript
// ✅ ПРАВИЛЬНО - функции возвращают функции
function multiplier(factor: number): (x: number) => number {
  return (x: number) => x * factor;
}

const double = multiplier(2);
const triple = multiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// Currying
function add(a: number): (b: number) => number {
  return (b: number) => a + b;
}

const add5 = add(5);
console.log(add5(10)); // 15

// Typed currying
type CurriedFunction<A, B, R> = (a: A) => (b: B) => R;

const curriedAdd: CurriedFunction<number, number, number> = (a) => (b) => a + b;
```

## Async Functions

### Promise return types
```typescript
// ✅ ПРАВИЛЬНО - async функции
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data as User;
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  return response.json();
}

// Обработка ошибок
async function fetchData(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}
```

### Promise utilities
```typescript
// ✅ ПРАВИЛЬНО - работа с Promise
async function fetchAll<T>(
  urls: string[]
): Promise<T[]> {
  return Promise.all(
    urls.map(url => fetch(url).then(r => r.json()))
  );
}

async function fetchFirst<T>(
  urls: string[]
): Promise<T> {
  return Promise.race(
    urls.map(url => fetch(url).then(r => r.json()))
  );
}

// Generic async function
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
    }
  }
  throw new Error("All attempts failed");
}
```

## Function Types

### Type aliases
```typescript
// ✅ ПРАВИЛЬНО - type aliases для функций
type MathOperation = (a: number, b: number) => number;

const add: MathOperation = (a, b) => a + b;
const subtract: MathOperation = (a, b) => a - b;
const multiply: MathOperation = (a, b) => a * b;

// Сложные функциональные типы
type AsyncOperation<T> = (
  input: string
) => Promise<T>;

type Middleware<T> = (
  value: T,
  next: (value: T) => void
) => void;

type EventHandler<T> = (event: T) => void | Promise<void>;
```

### Interface для функций
```typescript
// ✅ ПРАВИЛЬНО - интерфейсы с callable signature
interface Comparator<T> {
  (a: T, b: T): number;
}

const numberComparator: Comparator<number> = (a, b) => a - b;
const stringComparator: Comparator<string> = (a, b) => a.localeCompare(b);

// Функция с свойствами
interface Counter {
  (): number;
  reset(): void;
  count: number;
}

function createCounter(): Counter {
  let count = 0;
  
  const counter = (() => ++count) as Counter;
  counter.reset = () => { count = 0; };
  Object.defineProperty(counter, "count", {
    get: () => count
  });
  
  return counter;
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
counter.reset();
console.log(counter()); // 1
```

## Utility Function Patterns

### Type guards
```typescript
// ✅ ПРАВИЛЬНО - type guard functions
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "email" in value
  );
}

// Использование
function process(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // value is string
  } else if (isNumber(value)) {
    console.log(value.toFixed(2)); // value is number
  }
}
```

### Assert functions
```typescript
// ✅ ПРАВИЛЬНО - assert functions
function assertIsDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is not defined");
  }
}

function processUser(user: User | null) {
  assertIsDefined(user, "User not found");
  // После assert, user точно не null
  console.log(user.name);
}

// Assert для типов
function assertIsString(
  value: unknown
): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Value is not a string");
  }
}
```

## Декораторы (Experimental)

### Method decorators
```typescript
// ✅ ПРАВИЛЬНО - декораторы методов
function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args);
    const result = originalMethod.apply(this, args);
    console.log(`Result:`, result);
    return result;
  };
  
  return descriptor;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

// Parameter decorators
function required(
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) {
  console.log(`Parameter ${parameterIndex} of ${String(propertyKey)} is required`);
}

class User {
  greet(@required name: string) {
    return `Hello, ${name}!`;
  }
}
```

## Pure Functions

### Immutability
```typescript
// ✅ ПРАВИЛЬНО - чистые функции без side effects
function addItem<T>(array: readonly T[], item: T): T[] {
  return [...array, item];
}

function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}

// ❌ НЕПРАВИЛЬНО - мутация входных данных
function addItem<T>(array: T[], item: T): T[] {
  array.push(item); // Изменяет оригинальный массив!
  return array;
}

// ✅ ПРАВИЛЬНО - immutable операции
function removeItem<T>(array: readonly T[], index: number): T[] {
  return [...array.slice(0, index), ...array.slice(index + 1)];
}

function updateProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
): T {
  return { ...obj, [key]: value };
}
```

## React Function Components

### Basic components
```typescript
// ✅ ПРАВИЛЬНО - типизированные React компоненты
import React from "react";

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = "primary"
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};

// С children
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
};
```

### Hooks
```typescript
// ✅ ПРАВИЛЬНО - типизированные hooks
import { useState, useEffect, useCallback, useMemo } from "react";

function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState<number>(initialValue);
  
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);
  
  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);
  
  return { count, increment, decrement, reset };
}

// Generic hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);
  
  return { data, loading, error };
}

// Использование
interface User {
  id: number;
  name: string;
}

function UserComponent() {
  const { data, loading, error } = useFetch<User>("/api/user");
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;
  
  return <div>{data.name}</div>;
}
```

## Чеклист функций

- [ ] Все параметры и возвращаемые значения типизированы
- [ ] Optional параметры после обязательных
- [ ] Default значения для optional параметров
- [ ] Generic для универсальных функций
- [ ] Constraints для generic типов
- [ ] Arrow functions для коротких функций
- [ ] Promise<T> для async функций
- [ ] Type guards возвращают "value is Type"
- [ ] Pure functions без side effects
- [ ] React компоненты с типизированными props
