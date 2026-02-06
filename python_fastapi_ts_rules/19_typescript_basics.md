# TypeScript Basics - Основы

## Общие принципы

- **Type Safety** - строгая типизация везде
- **Explicit over Implicit** - явные типы предпочтительнее
- **Modern JS** - используйте современные возможности ES6+
- **Strict Mode** - всегда включайте strict режим

## TypeScript Configuration

### tsconfig.json
```json
// ✅ ПРАВИЛЬНО - строгая конфигурация (TypeScript 5.x)
{
  "compilerOptions": {
    // Строгие проверки
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Дополнительные проверки
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    // Модули (TypeScript 5.x)
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "verbatimModuleSyntax": true,

    // Paths
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    },

    // Output
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "declaration": true,

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    // JSX (для React 19)
    "jsx": "react-jsx",

    // Другое
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

## TypeScript 5.x Features

### satisfies operator
```typescript
// ✅ ПРАВИЛЬНО - satisfies проверяет тип БЕЗ расширения
type Colors = Record<string, [number, number, number] | string>;

const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies Colors;

// Type inference сохраняется!
palette.red[0];       // number (а не number | string)
palette.green.toUpperCase(); // работает!

// ❌ С обычной аннотацией типа - теряем точный тип
const palette2: Colors = {
  red: [255, 0, 0],
  green: "#00ff00",
};
// palette2.red[0] - Error: может быть string
```

### const type parameters
```typescript
// ✅ ПРАВИЛЬНО - const делает literal types
function createRoutes<const T extends readonly string[]>(routes: T): T {
  return routes;
}

const routes = createRoutes(["home", "about", "contact"]);
// Тип: readonly ["home", "about", "contact"]
// БЕЗ const было бы: readonly string[]

// Полезно для объектов
function defineConfig<const T extends object>(config: T): T {
  return config;
}

const config = defineConfig({
  mode: "production",
  port: 3000,
});
// mode: "production" (не string!)
```

### Improved type inference
```typescript
// Лучший вывод типов для generic функций
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// TypeScript 5.x лучше выводит типы
const arr = [1, 2, 3];
const first = firstElement(arr); // number | undefined

// Return type inference улучшен
const getUser = async () => {
  const response = await fetch("/api/user");
  return response.json() as Promise<User>;
};
// Тип правильно выводится как Promise<User>
```

### using keyword (Explicit Resource Management)
```typescript
// ✅ TypeScript 5.2+ - автоматическое освобождение ресурсов
class FileHandle implements Disposable {
  constructor(private path: string) {}

  [Symbol.dispose](): void {
    console.log(`Closing file: ${this.path}`);
  }
}

function processFile() {
  using file = new FileHandle("/tmp/data.txt");
  // работаем с файлом...
  // file автоматически закроется при выходе из scope
}

// Для async
class AsyncResource implements AsyncDisposable {
  async [Symbol.asyncDispose](): Promise<void> {
    await cleanup();
  }
}

async function process() {
  await using resource = new AsyncResource();
  // resource автоматически освободится
}
```

## Базовые типы

### Примитивные типы
```typescript
// ✅ ПРАВИЛЬНО - явные типы
const name: string = "John";
const age: number = 30;
const isActive: boolean = true;
const nothing: null = null;
const notDefined: undefined = undefined;

// Символы и BigInt
const id: symbol = Symbol("id");
const bigNumber: bigint = 100n;

// ❌ НЕПРАВИЛЬНО - неявные any
const data = fetchData(); // any
const value = JSON.parse('{}'); // any
```

### Arrays и Tuples
```typescript
// ✅ ПРАВИЛЬНО - типизированные массивы
const numbers: number[] = [1, 2, 3];
const strings: Array<string> = ["a", "b", "c"];
const mixed: (string | number)[] = [1, "two", 3];

// Readonly arrays
const immutableArray: ReadonlyArray<number> = [1, 2, 3];
// immutableArray.push(4); // Error!

// Tuples
const tuple: [string, number] = ["John", 30];
const [name, age] = tuple;

// Named tuples
const point: [x: number, y: number] = [10, 20];

// ❌ НЕПРАВИЛЬНО - any массивы
const data = []; // any[]
```

### Objects
```typescript
// ✅ ПРАВИЛЬНО - типизированные объекты
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional
  readonly createdAt: Date; // Readonly
}

const user: User = {
  id: 1,
  name: "John",
  email: "john@example.com",
  createdAt: new Date()
};

// Type alias
type Point = {
  x: number;
  y: number;
};

const point: Point = { x: 10, y: 20 };

// Index signature
interface StringMap {
  [key: string]: string;
}

const map: StringMap = {
  name: "John",
  email: "john@example.com"
};
```

## Type Inference

### Автоматический вывод типов
```typescript
// ✅ ПРАВИЛЬНО - TypeScript выводит типы
const message = "Hello"; // string
const count = 42; // number
const isValid = true; // boolean

// Вывод из функций
function add(a: number, b: number) {
  return a + b; // number
}

const result = add(1, 2); // number

// Вывод из объектов
const user = {
  name: "John",
  age: 30
}; // { name: string; age: number }

// ✅ ПРАВИЛЬНО - явные типы когда нужно
let value: string | number;
value = "text";
value = 123;
```

## Union и Intersection Types

### Union Types
```typescript
// ✅ ПРАВИЛЬНО - union для альтернатив
type Status = "pending" | "success" | "error";

function handleStatus(status: Status): void {
  switch (status) {
    case "pending":
      console.log("Loading...");
      break;
    case "success":
      console.log("Success!");
      break;
    case "error":
      console.log("Error!");
      break;
  }
}

// Union с разными типами
type StringOrNumber = string | number;

function format(value: StringOrNumber): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value.toString();
}
```

### Intersection Types
```typescript
// ✅ ПРАВИЛЬНО - intersection для комбинирования
interface Named {
  name: string;
}

interface Aged {
  age: number;
}

type Person = Named & Aged;

const person: Person = {
  name: "John",
  age: 30
};

// Mixins
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

type TimestampedUser = User & Timestamped;
```

## Type Guards

### Проверка типов
```typescript
// ✅ ПРАВИЛЬНО - type guards
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function processValue(value: string | number): void {
  if (isString(value)) {
    console.log(value.toUpperCase()); // string
  } else {
    console.log(value.toFixed(2)); // number
  }
}

// instanceof guard
class Dog {
  bark(): void {}
}

class Cat {
  meow(): void {}
}

function makeSound(animal: Dog | Cat): void {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}

// in operator guard
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

function move(animal: Fish | Bird): void {
  if ("swim" in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}
```

## Generics

### Generic функции
```typescript
// ✅ ПРАВИЛЬНО - generic функции
function identity<T>(value: T): T {
  return value;
}

const num = identity(42); // number
const str = identity("hello"); // string

// Multiple type parameters
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair("hello", 42); // [string, number]

// Generic constraints
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(value: T): void {
  console.log(value.length);
}

logLength("hello"); // OK
logLength([1, 2, 3]); // OK
// logLength(123); // Error!
```

### Generic интерфейсы
```typescript
// ✅ ПРАВИЛЬНО - generic интерфейсы
interface Box<T> {
  value: T;
}

const stringBox: Box<string> = { value: "hello" };
const numberBox: Box<number> = { value: 42 };

// Generic классы
class Container<T> {
  constructor(private value: T) {}
  
  getValue(): T {
    return this.value;
  }
  
  setValue(value: T): void {
    this.value = value;
  }
}

const container = new Container<number>(42);
```

## Utility Types

### Встроенные utility types
```typescript
// ✅ ПРАВИЛЬНО - использование utility types
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Partial - все поля optional
type PartialUser = Partial<User>;

// Required - все поля required
type RequiredUser = Required<User>;

// Readonly - все поля readonly
type ReadonlyUser = Readonly<User>;

// Pick - выбрать поля
type UserPreview = Pick<User, "id" | "name">;

// Omit - исключить поля
type UserWithoutPassword = Omit<User, "password">;

// Record - создать тип объекта
type UserRoles = Record<string, boolean>;

// ReturnType - тип возвращаемого значения
function getUser() {
  return { id: 1, name: "John" };
}
type UserReturn = ReturnType<typeof getUser>;

// Parameters - типы параметров функции
type GetUserParams = Parameters<typeof getUser>;
```

## Enums

### Enum типы
```typescript
// ✅ ПРАВИЛЬНО - numeric enum
enum Status {
  Pending = 0,
  Active = 1,
  Inactive = 2
}

const status: Status = Status.Active;

// String enum (предпочтительнее)
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

// Const enum (для производительности)
const enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

// ✅ ПРАВИЛЬНО - union вместо enum (современный подход)
type Status = "pending" | "active" | "inactive";

const status: Status = "active";
```

## Type Assertions

### Приведение типов
```typescript
// ✅ ПРАВИЛЬНО - type assertions
const value: unknown = "hello";
const length = (value as string).length;

// Angle bracket syntax (не работает в JSX)
const length2 = (<string>value).length;

// Non-null assertion
function getValue(): string | null {
  return "hello";
}

const value = getValue()!; // string (не null)

// ❌ НЕПРАВИЛЬНО - избегайте излишних assertions
const value = "hello" as any as number; // Bad!

// ✅ ПРАВИЛЬНО - используйте type guards вместо assertions
if (typeof value === "string") {
  console.log(value.length);
}
```

## Narrowing

### Type narrowing
```typescript
// ✅ ПРАВИЛЬНО - narrowing через проверки
function processValue(value: string | number): string {
  // typeof narrowing
  if (typeof value === "string") {
    return value.toUpperCase(); // string
  }
  return value.toString(); // number
}

// Truthiness narrowing
function processArray(arr: string[] | null): number {
  if (arr) {
    return arr.length; // string[]
  }
  return 0;
}

// Equality narrowing
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // x и y оба string
    x.toUpperCase();
    y.toUpperCase();
  }
}

// Discriminated unions
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

type Shape = Circle | Square;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.sideLength ** 2;
  }
}
```

## Module System

### ES Modules
```typescript
// ✅ ПРАВИЛЬНО - named exports
// utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

export const PI = 3.14;

export interface User {
  id: number;
  name: string;
}

// Default export
export default class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// Import
import Calculator, { add, PI, type User } from "./utils";

// Re-export
export { add, PI } from "./utils";
export type { User } from "./utils";
```

## Декораторы

### Experimental decorators
```typescript
// ✅ ПРАВИЛЬНО - декораторы (требует experimentalDecorators)
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args);
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

// Property decorator
function readonly(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    writable: false
  });
}

class Person {
  @readonly
  name: string = "John";
}
```

## ESLint Configuration

### .eslintrc.json
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_" 
    }],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "prefix": ["I"]
      }
    ]
  }
}
```

## Prettier Configuration

### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## Чеклист TypeScript Basics

- [ ] strict режим включен в tsconfig.json
- [ ] Явные типы для всех переменных и параметров
- [ ] Type guards для проверки типов
- [ ] Generics для переиспользуемого кода
- [ ] Utility types вместо дублирования
- [ ] Union types вместо enum (где возможно)
- [ ] ES Modules для импортов/экспортов
- [ ] ESLint настроен для TypeScript
- [ ] Prettier для единообразного форматирования
- [ ] Избегайте any, используйте unknown
