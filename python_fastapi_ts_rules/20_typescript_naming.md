# TypeScript Naming - Соглашения об именовании

## Общие принципы

- **Описательные имена** - понятные и ясные
- **camelCase** для переменных и функций
- **PascalCase** для классов и типов
- **UPPER_SNAKE_CASE** для констант

## Переменные

### camelCase для переменных
```typescript
// ✅ ПРАВИЛЬНО - camelCase
const userName = "John";
const isActive = true;
const userCount = 10;
const totalPrice = 100.50;

// Массивы - множественное число
const users = ["John", "Jane"];
const items = [1, 2, 3];
const productIds = [101, 102, 103];

// ❌ НЕПРАВИЛЬНО
const UserName = "John"; // PascalCase для переменной
const user_name = "John"; // snake_case
const TOTAL_PRICE = 100; // для обычной переменной
```

### Boolean переменные
```typescript
// ✅ ПРАВИЛЬНО - is, has, can, should префиксы
const isValid = true;
const hasPermission = false;
const canEdit = true;
const shouldUpdate = false;
const isLoading = false;
const hasError = false;

// ❌ НЕПРАВИЛЬНО
const valid = true; // неясно что это boolean
const permission = false;
const edit = true;
```

### Private переменные
```typescript
// ✅ ПРАВИЛЬНО - префикс _ для приватных
class User {
  private _id: number;
  private _password: string;
  
  constructor(id: number, password: string) {
    this._id = id;
    this._password = password;
  }
  
  get id(): number {
    return this._id;
  }
}

// ✅ ПРАВИЛЬНО - # для приватных полей (ES2022)
class User {
  #id: number;
  #password: string;
  
  constructor(id: number, password: string) {
    this.#id = id;
    this.#password = password;
  }
}
```

## Константы

### UPPER_SNAKE_CASE
```typescript
// ✅ ПРАВИЛЬНО - глобальные константы
const MAX_RETRIES = 3;
const API_BASE_URL = "https://api.example.com";
const DEFAULT_TIMEOUT = 5000;
const HTTP_STATUS_OK = 200;

// Enum-like объекты
const Colors = {
  RED: "#FF0000",
  GREEN: "#00FF00",
  BLUE: "#0000FF",
} as const;

// ❌ НЕПРАВИЛЬНО - обычные переменные как константы
const maxRetries = 3; // Для констант используйте UPPER_SNAKE_CASE
```

### Конфигурационные объекты
```typescript
// ✅ ПРАВИЛЬНО - camelCase для конфигураций
const apiConfig = {
  baseUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
};

const defaultSettings = {
  theme: "light",
  language: "en",
  notifications: true,
};
```

## Функции

### camelCase для функций
```typescript
// ✅ ПРАВИЛЬНО - глаголы для действий
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function getUserById(id: number): User {
  return users.find(u => u.id === id);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ НЕПРАВИЛЬНО
function CalculateTotal(items: Item[]): number {} // PascalCase
function get_user(id: number): User {} // snake_case
function user(id: number): User {} // не глагол
```

### Boolean функции
```typescript
// ✅ ПРАВИЛЬНО - is, has, can, should
function isValid(value: string): boolean {
  return value.length > 0;
}

function hasPermission(user: User, action: string): boolean {
  return user.permissions.includes(action);
}

function canAccess(user: User, resource: string): boolean {
  return user.role === "admin";
}

function shouldUpdate(oldValue: any, newValue: any): boolean {
  return oldValue !== newValue;
}
```

### Event handlers
```typescript
// ✅ ПРАВИЛЬНО - handle/on префикс
function handleClick(event: MouseEvent): void {
  console.log("Clicked");
}

function handleSubmit(event: FormEvent): void {
  event.preventDefault();
}

const onClick = (event: MouseEvent): void => {
  // ...
};

const onSubmit = (event: FormEvent): void => {
  // ...
};

// В React компонентах
const handleUserClick = (userId: number): void => {
  // ...
};
```

### Async функции
```typescript
// ✅ ПРАВИЛЬНО - четкие имена для async
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

async function saveUser(user: User): Promise<void> {
  await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

// ❌ НЕПРАВИЛЬНО - неясно что async
function getUser(id: number): Promise<User> {
  // Лучше назвать fetchUser
}
```

## Классы

### PascalCase для классов
```typescript
// ✅ ПРАВИЛЬНО - PascalCase
class User {
  constructor(public name: string) {}
}

class UserManager {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
}

class HTTPClient {
  get(url: string): Promise<Response> {
    return fetch(url);
  }
}

// ❌ НЕПРАВИЛЬНО
class user {} // не PascalCase
class user_manager {} // snake_case
class IUser {} // префикс I не используется для классов
```

### Abstract классы
```typescript
// ✅ ПРАВИЛЬНО - Abstract/Base префикс опционален
abstract class BaseRepository<T> {
  abstract save(entity: T): Promise<void>;
  abstract find(id: number): Promise<T | null>;
}

abstract class Animal {
  abstract makeSound(): void;
}

// Или без префикса
abstract class Repository<T> {
  abstract save(entity: T): Promise<void>;
}
```

## Interfaces и Types

### PascalCase с префиксом I (опционально)
```typescript
// ✅ ПРАВИЛЬНО - с префиксом I
interface IUser {
  id: number;
  name: string;
  email: string;
}

interface IUserRepository {
  findById(id: number): Promise<IUser | null>;
  save(user: IUser): Promise<void>;
}

// ✅ ПРАВИЛЬНО - без префикса (современный подход)
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Type aliases
type UserId = number;
type UserStatus = "active" | "inactive" | "banned";
type UserCallback = (user: User) => void;

// ❌ НЕПРАВИЛЬНО
interface user {} // не PascalCase
interface User_Interface {} // snake_case
type userId = number; // не PascalCase
```

### Generics
```typescript
// ✅ ПРАВИЛЬНО - одна буква T, U, V или описательное имя
interface Box<T> {
  value: T;
}

interface Map<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
}

// Описательные имена для сложных случаев
interface Repository<EntityType, IdType = number> {
  find(id: IdType): Promise<EntityType | null>;
}

// ❌ НЕПРАВИЛЬНО
interface Box<t> {} // строчная буква
interface Map<key, value> {} // не PascalCase
```

## Enums

### PascalCase для enum и значений
```typescript
// ✅ ПРАВИЛЬНО - PascalCase
enum UserRole {
  Admin = "ADMIN",
  Moderator = "MODERATOR",
  User = "USER",
}

enum HttpStatus {
  Ok = 200,
  NotFound = 404,
  ServerError = 500,
}

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

// ❌ НЕПРАВИЛЬНО
enum userRole {} // не PascalCase
enum UserRole {
  admin = "ADMIN", // не PascalCase
  MODERATOR = "MODERATOR", // UPPER_CASE
}
```

### Const enums
```typescript
// ✅ ПРАВИЛЬНО - const enum для производительности
const enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}
```

## Modules и Files

### kebab-case для файлов
```typescript
// ✅ ПРАВИЛЬНО - kebab-case
// user-service.ts
// user-repository.ts
// api-client.ts
// http-utils.ts

// ✅ ПРАВИЛЬНО - для компонентов возможен PascalCase
// UserProfile.tsx
// HeaderMenu.tsx
// Button.tsx

// ❌ НЕПРАВИЛЬНО
// UserService.ts (для не-компонентов)
// user_service.ts (snake_case)
```

### Структура импортов
```typescript
// ✅ ПРАВИЛЬНО - группировка импортов
// 1. Сторонние библиотеки
import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";

// 2. Алиасы проекта
import { User } from "@/types";
import { UserService } from "@/services";

// 3. Относительные импорты
import { Button } from "../components";
import { formatDate } from "./utils";

// 4. Стили
import "./styles.css";
```

## React Components

### PascalCase для компонентов
```typescript
// ✅ ПРАВИЛЬНО - PascalCase
function UserProfile({ user }: { user: User }) {
  return <div>{user.name}</div>;
}

const HeaderMenu: React.FC = () => {
  return <nav>Menu</nav>;
};

// Higher-Order Components
function withAuth<P>(Component: React.ComponentType<P>) {
  return (props: P) => {
    // ...
    return <Component {...props} />;
  };
}

// ❌ НЕПРАВИЛЬНО
function userProfile() {} // не PascalCase
const header_menu = () => {} // snake_case
```

### Props interfaces
```typescript
// ✅ ПРАВИЛЬНО - ComponentNameProps
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

function UserProfile({ user, onUpdate }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// Или inline
function Button({ 
  children,
  onClick 
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return <button onClick={onClick}>{children}</button>;
}
```

### Hooks
```typescript
// ✅ ПРАВИЛЬНО - use префикс
function useUser(userId: number) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return user;
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  return [value, setValue] as const;
}

// ❌ НЕПРАВИЛЬНО
function getUser(userId: number) {} // не use префикс
function userHook() {} // неправильный префикс
```

## Type Guards

### is префикс для type guards
```typescript
// ✅ ПРАВИЛЬНО - is префикс
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isUser(obj: any): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## Утилитарные функции

### Описательные имена
```typescript
// ✅ ПРАВИЛЬНО - четкие имена утилит
function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
```

## API и HTTP

### REST endpoints
```typescript
// ✅ ПРАВИЛЬНО - API методы
class UserAPI {
  async getUsers(): Promise<User[]> {
    return this.get("/users");
  }
  
  async getUserById(id: number): Promise<User> {
    return this.get(`/users/${id}`);
  }
  
  async createUser(user: CreateUserDto): Promise<User> {
    return this.post("/users", user);
  }
  
  async updateUser(id: number, user: UpdateUserDto): Promise<User> {
    return this.put(`/users/${id}`, user);
  }
  
  async deleteUser(id: number): Promise<void> {
    return this.delete(`/users/${id}`);
  }
}
```

## Constants и Configs

### Группировка констант
```typescript
// ✅ ПРАВИЛЬНО - объекты для группировки
export const API = {
  BASE_URL: "https://api.example.com",
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
} as const;

export const ROUTES = {
  HOME: "/",
  USERS: "/users",
  USER_DETAIL: "/users/:id",
  PROFILE: "/profile",
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_USERNAME_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
```

## Сокращения

### Общепринятые сокращения
```typescript
// ✅ ПРАВИЛЬНО - стандартные сокращения
const id = 1; // identifier
const url = "https://example.com";
const api = new API();
const http = new HTTPClient();
const dto = new CreateUserDto();
const ctx = useContext();
const ref = useRef();
const max = Math.max(1, 2, 3);
const min = Math.min(1, 2, 3);
const temp = tempValue; // temporary
const idx = 0; // index

// ❌ НЕПРАВИЛЬНО - непонятные сокращения
const usrMgr = new UserManager(); // userManager
const btn = document.querySelector("button"); // button
const msg = "Hello"; // message
const cnt = 0; // count
```

## Аббревиатуры

### Форматирование аббревиатур
```typescript
// ✅ ПРАВИЛЬНО - первая буква заглавная, остальные строчные
const userId = 1;
const htmlElement = document.createElement("div");
const xmlParser = new XMLParser();
const httpRequest = new HTTPRequest();
const jsonData = JSON.parse(text);

class HttpClient {}
class XmlParser {}
class ApiService {}

// ❌ НЕПРАВИЛЬНО - все заглавные
const userID = 1; // userId
const HTMLElement = document.createElement("div"); // htmlElement
const XMLParser = new XMLParser(); // XmlParser (класс - исключение)
```

## ESLint Rules для именования

### Настройка правил
```json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "default",
        "format": ["camelCase"]
      },
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      },
      {
        "selector": "parameter",
        "format": ["camelCase"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      },
      {
        "selector": "enumMember",
        "format": ["PascalCase"]
      },
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "prefix": ["I"]
      }
    ]
  }
}
```

## Чеклист именования

- [ ] camelCase для переменных и функций
- [ ] PascalCase для классов, интерфейсов, типов
- [ ] UPPER_SNAKE_CASE для констант
- [ ] is/has/can/should для boolean
- [ ] Глаголы для функций
- [ ] kebab-case для файлов
- [ ] use префикс для React hooks
- [ ] handle/on префикс для event handlers
- [ ] Описательные имена, избегайте сокращений
- [ ] Префикс I для интерфейсов (опционально)
