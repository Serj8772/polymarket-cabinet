# TypeScript Classes - Классы

## Общие принципы

- **Access modifiers** - используйте public/private/protected
- **Readonly** для неизменяемых полей
- **Interfaces** для контрактов
- **Composition** вместо наследования где возможно

## Базовые классы

### Определение класса
```typescript
// ✅ ПРАВИЛЬНО - класс с типами
class User {
  // Поля с типами
  private id: number;
  public name: string;
  protected email: string;
  readonly createdAt: Date;

  constructor(id: number, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }

  // Методы с типами
  public getName(): string {
    return this.name;
  }

  private validateEmail(): boolean {
    return this.email.includes("@");
  }
}

// ❌ НЕПРАВИЛЬНО - без типов и модификаторов
class User {
  id;
  name;
  
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}
```

### Parameter Properties
```typescript
// ✅ ПРАВИЛЬНО - сокращенный синтаксис
class User {
  constructor(
    private id: number,
    public name: string,
    protected email: string,
    public readonly createdAt: Date = new Date()
  ) {}

  public getId(): number {
    return this.id;
  }
}

// Эквивалентно:
class User {
  private id: number;
  public name: string;
  protected email: string;
  public readonly createdAt: Date;

  constructor(id: number, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }
}
```

## Access Modifiers

### public, private, protected
```typescript
// ✅ ПРАВИЛЬНО - правильные модификаторы доступа
class BankAccount {
  private balance: number;
  protected accountNumber: string;
  public owner: string;

  constructor(owner: string, initialBalance: number) {
    this.owner = owner;
    this.balance = initialBalance;
    this.accountNumber = this.generateAccountNumber();
  }

  // Public - доступен везде
  public getBalance(): number {
    return this.balance;
  }

  // Private - доступен только в этом классе
  private generateAccountNumber(): string {
    return `ACC${Date.now()}`;
  }

  // Protected - доступен в этом классе и наследниках
  protected log(message: string): void {
    console.log(`[${this.accountNumber}] ${message}`);
  }
}

class SavingsAccount extends BankAccount {
  private interestRate: number;

  constructor(owner: string, initialBalance: number, interestRate: number) {
    super(owner, initialBalance);
    this.interestRate = interestRate;
  }

  public addInterest(): void {
    const interest = this.getBalance() * this.interestRate;
    // this.balance += interest; // Ошибка: balance is private!
    this.log(`Added interest: ${interest}`); // OK: log is protected
  }
}
```

### readonly
```typescript
// ✅ ПРАВИЛЬНО - readonly для неизменяемых полей
class Config {
  readonly apiUrl: string;
  readonly timeout: number;
  readonly maxRetries: number;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.timeout = 5000;
    this.maxRetries = 3;
  }

  // updateApiUrl(newUrl: string): void {
  //   this.apiUrl = newUrl; // Ошибка: Cannot assign to 'apiUrl'
  // }
}
```

## Getters и Setters

### Accessors
```typescript
// ✅ ПРАВИЛЬНО - getters и setters
class Temperature {
  private _celsius: number = 0;

  get celsius(): number {
    return this._celsius;
  }

  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error("Temperature below absolute zero!");
    }
    this._celsius = value;
  }

  get fahrenheit(): number {
    return (this._celsius * 9/5) + 32;
  }

  set fahrenheit(value: number) {
    this.celsius = (value - 32) * 5/9;
  }
}

// Использование
const temp = new Temperature();
temp.celsius = 25;
console.log(temp.fahrenheit); // 77

temp.fahrenheit = 100;
console.log(temp.celsius); // 37.78
```

## Static Members

### Static свойства и методы
```typescript
// ✅ ПРАВИЛЬНО - static members
class MathUtils {
  static readonly PI: number = 3.14159;
  static readonly E: number = 2.71828;

  private constructor() {
    // Private constructor - нельзя создать экземпляр
  }

  static square(x: number): number {
    return x * x;
  }

  static circleArea(radius: number): number {
    return this.PI * this.square(radius);
  }
}

// Использование
console.log(MathUtils.PI);
console.log(MathUtils.square(5));
console.log(MathUtils.circleArea(10));

// const utils = new MathUtils(); // Ошибка: constructor is private
```

## Abstract Classes

### Абстрактные классы
```typescript
// ✅ ПРАВИЛЬНО - абстрактный класс
abstract class Shape {
  protected color: string;

  constructor(color: string) {
    this.color = color;
  }

  // Абстрактный метод - должен быть реализован в подклассах
  abstract getArea(): number;
  abstract getPerimeter(): number;

  // Обычный метод
  public describe(): string {
    return `A ${this.color} shape with area ${this.getArea()}`;
  }
}

class Circle extends Shape {
  private radius: number;

  constructor(color: string, radius: number) {
    super(color);
    this.radius = radius;
  }

  public getArea(): number {
    return Math.PI * this.radius ** 2;
  }

  public getPerimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(
    color: string,
    private width: number,
    private height: number
  ) {
    super(color);
  }

  public getArea(): number {
    return this.width * this.height;
  }

  public getPerimeter(): number {
    return 2 * (this.width + this.height);
  }
}

// const shape = new Shape("red"); // Ошибка: Cannot create instance
const circle = new Circle("red", 10);
const rect = new Rectangle("blue", 5, 10);
```

## Interfaces и Classes

### Implementing interfaces
```typescript
// ✅ ПРАВИЛЬНО - класс реализует интерфейс
interface Printable {
  print(): void;
}

interface Saveable {
  save(): void;
  load(): void;
}

class Document implements Printable, Saveable {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  public print(): void {
    console.log(this.content);
  }

  public save(): void {
    localStorage.setItem("document", this.content);
  }

  public load(): void {
    this.content = localStorage.getItem("document") || "";
  }
}
```

### Extending interfaces
```typescript
// ✅ ПРАВИЛЬНО - интерфейс расширяет интерфейс
interface Entity {
  id: number;
  createdAt: Date;
}

interface Timestamped {
  updatedAt: Date;
}

interface User extends Entity, Timestamped {
  username: string;
  email: string;
}

class UserModel implements User {
  constructor(
    public id: number,
    public username: string,
    public email: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}
```

## Generics в классах

### Generic классы
```typescript
// ✅ ПРАВИЛЬНО - generic класс
class Box<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  public getValue(): T {
    return this.value;
  }

  public setValue(value: T): void {
    this.value = value;
  }
}

const numberBox = new Box<number>(42);
const stringBox = new Box<string>("hello");

// Generic с constraints
class DataStore<T extends { id: number }> {
  private data: Map<number, T> = new Map();

  public add(item: T): void {
    this.data.set(item.id, item);
  }

  public get(id: number): T | undefined {
    return this.data.get(id);
  }

  public getAll(): T[] {
    return Array.from(this.data.values());
  }
}

interface User {
  id: number;
  name: string;
}

const userStore = new DataStore<User>();
userStore.add({ id: 1, name: "John" });
```

## Inheritance

### Наследование
```typescript
// ✅ ПРАВИЛЬНО - наследование с super
class Animal {
  protected name: string;
  protected age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  public makeSound(): string {
    return "Some sound";
  }

  public describe(): string {
    return `${this.name} is ${this.age} years old`;
  }
}

class Dog extends Animal {
  private breed: string;

  constructor(name: string, age: number, breed: string) {
    super(name, age); // Вызов конструктора родителя
    this.breed = breed;
  }

  // Override метода
  public makeSound(): string {
    return "Woof!";
  }

  // Расширение метода родителя
  public describe(): string {
    return `${super.describe()} and is a ${this.breed}`;
  }

  // Новый метод
  public fetch(): void {
    console.log(`${this.name} is fetching!`);
  }
}

const dog = new Dog("Rex", 5, "Labrador");
console.log(dog.makeSound()); // "Woof!"
console.log(dog.describe()); // "Rex is 5 years old and is a Labrador"
```

## Composition

### Предпочитайте композицию
```typescript
// ✅ ПРАВИЛЬНО - композиция вместо наследования
class Engine {
  private horsepower: number;

  constructor(horsepower: number) {
    this.horsepower = horsepower;
  }

  public start(): void {
    console.log(`Engine with ${this.horsepower}hp started`);
  }

  public stop(): void {
    console.log("Engine stopped");
  }
}

class Car {
  private engine: Engine;
  private model: string;

  constructor(model: string, engine: Engine) {
    this.model = model;
    this.engine = engine;
  }

  public start(): void {
    console.log(`Starting ${this.model}`);
    this.engine.start();
  }

  public stop(): void {
    console.log(`Stopping ${this.model}`);
    this.engine.stop();
  }
}

// Использование
const engine = new Engine(200);
const car = new Car("Tesla Model S", engine);
car.start();
```

## Decorators

### Class decorators
```typescript
// ✅ ПРАВИЛЬНО - class decorator
function sealed(constructor: Function): void {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class BugReport {
  type = "report";
  title: string;

  constructor(title: string) {
    this.title = title;
  }
}

// Method decorator
function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]): any {
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
```

## Mixins

### Mixin pattern
```typescript
// ✅ ПРАВИЛЬНО - mixins
type Constructor<T = {}> = new (...args: any[]) => T;

// Mixin для добавления timestamp
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    timestamp = new Date();

    getTimestamp(): Date {
      return this.timestamp;
    }
  };
}

// Mixin для добавления логирования
function Loggable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    log(message: string): void {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  };
}

// Базовый класс
class User {
  constructor(public name: string) {}
}

// Применение mixins
const TimestampedUser = Timestamped(User);
const LoggableUser = Loggable(TimestampedUser);

const user = new LoggableUser("John");
user.log("User created");
console.log(user.getTimestamp());
```

## Design Patterns

### Singleton
```typescript
// ✅ ПРАВИЛЬНО - singleton pattern
class Database {
  private static instance: Database;
  private connection: any;

  private constructor() {
    // Private constructor
    this.connection = this.createConnection();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private createConnection(): any {
    return { connected: true };
  }

  public query(sql: string): any {
    return this.connection.execute(sql);
  }
}

// Использование
const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2); // true
```

### Factory
```typescript
// ✅ ПРАВИЛЬНО - factory pattern
interface Product {
  name: string;
  price: number;
  getDescription(): string;
}

class Book implements Product {
  constructor(
    public name: string,
    public price: number,
    public author: string
  ) {}

  getDescription(): string {
    return `${this.name} by ${this.author}`;
  }
}

class Electronics implements Product {
  constructor(
    public name: string,
    public price: number,
    public warranty: number
  ) {}

  getDescription(): string {
    return `${this.name} with ${this.warranty} year warranty`;
  }
}

class ProductFactory {
  static createProduct(
    type: "book" | "electronics",
    name: string,
    price: number,
    extra: any
  ): Product {
    switch (type) {
      case "book":
        return new Book(name, price, extra);
      case "electronics":
        return new Electronics(name, price, extra);
      default:
        throw new Error("Unknown product type");
    }
  }
}

// Использование
const book = ProductFactory.createProduct("book", "TypeScript Guide", 29.99, "John Doe");
const phone = ProductFactory.createProduct("electronics", "iPhone", 999, 2);
```

### Builder
```typescript
// ✅ ПРАВИЛЬНО - builder pattern
class UserBuilder {
  private user: Partial<User> = {};

  setId(id: number): this {
    this.user.id = id;
    return this;
  }

  setName(name: string): this {
    this.user.name = name;
    return this;
  }

  setEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  setAge(age: number): this {
    this.user.age = age;
    return this;
  }

  build(): User {
    if (!this.user.id || !this.user.name || !this.user.email) {
      throw new Error("Missing required fields");
    }
    return this.user as User;
  }
}

// Использование
const user = new UserBuilder()
  .setId(1)
  .setName("John")
  .setEmail("john@example.com")
  .setAge(30)
  .build();
```

## Class с React

### React Component Class
```typescript
// ✅ ПРАВИЛЬНО - типизированный React класс компонент
import React from "react";

interface Props {
  title: string;
  count: number;
  onIncrement: () => void;
}

interface State {
  internalCount: number;
}

class Counter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      internalCount: 0
    };
  }

  handleClick = (): void => {
    this.setState((prevState) => ({
      internalCount: prevState.internalCount + 1
    }));
    this.props.onIncrement();
  };

  render(): React.ReactNode {
    return (
      <div>
        <h1>{this.props.title}</h1>
        <p>Props count: {this.props.count}</p>
        <p>Internal count: {this.state.internalCount}</p>
        <button onClick={this.handleClick}>Increment</button>
      </div>
    );
  }
}
```

## Чеклист классов

- [ ] Access modifiers (public/private/protected)
- [ ] Readonly для неизменяемых полей
- [ ] Типы для всех полей и методов
- [ ] Parameter properties где уместно
- [ ] Getters/setters вместо прямого доступа
- [ ] Abstract classes для базовых классов
- [ ] Interfaces для контрактов
- [ ] Generic классы где нужна гибкость
- [ ] Super() в конструкторе при наследовании
- [ ] Композиция вместо наследования где возможно
- [ ] Private constructor для singleton
- [ ] Design patterns где уместно
