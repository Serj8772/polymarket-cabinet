# React/Frontend - Фронтенд разработка

> **React 19 Update:** Новые хуки `use()`, `useActionState`, `useOptimistic`. `ref` теперь передаётся как prop. React Compiler автоматически мемоизирует компоненты.

## Общие принципы

- **Component-Based** - разработка через компоненты
- **Type Safety** - строгая типизация с TypeScript
- **Functional First** - функциональные компоненты и hooks
- **Immutability** - иммутабельность состояния
- **Single Responsibility** - один компонент = одна задача

## Структура проекта

### Рекомендуемая структура
```
src/
├── components/           # Переиспользуемые компоненты
│   ├── ui/              # UI компоненты (Button, Input и т.д.)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   └── Input/
│   └── features/        # Функциональные компоненты
│       ├── UserProfile/
│       └── ProductCard/
├── pages/               # Страницы приложения
│   ├── Home/
│   ├── About/
│   └── Dashboard/
├── hooks/               # Кастомные hooks
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useDebounce.ts
├── services/            # API сервисы
│   ├── api/
│   │   ├── users.ts
│   │   └── products.ts
│   └── auth.ts
├── store/               # State management (Redux/Zustand)
│   ├── slices/
│   └── index.ts
├── types/               # TypeScript типы
│   ├── user.ts
│   ├── product.ts
│   └── api.ts
├── utils/               # Утилиты
│   ├── formatters.ts
│   └── validators.ts
├── styles/              # Глобальные стили
│   ├── globals.css
│   └── variables.css
├── App.tsx
└── main.tsx
```

## Компоненты

### Функциональные компоненты (React 19)
```typescript
// ✅ ПРАВИЛЬНО - функция с типизированными props (без React.FC)
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export function Button({
  label,
  onClick,
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}

// ✅ ПРАВИЛЬНО - с children
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// ❌ УСТАРЕЛО - React.FC больше не рекомендуется
export const Button: React.FC<ButtonProps> = ({ label }) => {
  return <button>{label}</button>;
};

// ❌ УСТАРЕЛО - классовые компоненты
class Button extends React.Component {
  render() {
    return <button>{this.props.label}</button>;
  }
}
```

### ref как prop (React 19)
```typescript
// ✅ ПРАВИЛЬНО - ref передаётся как обычный prop (React 19)
interface InputProps {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ label, ref }: InputProps) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}

// Использование
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  return <Input label="Name" ref={inputRef} />;
}

// ❌ УСТАРЕЛО - forwardRef больше не нужен
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```
```

### Props и типизация
```typescript
// ✅ ПРАВИЛЬНО - детальная типизация props
interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  className?: string;
  children?: React.ReactNode;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  className,
  children,
}) => {
  return (
    <div className={className}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {children}
      {onEdit && <button onClick={() => onEdit(user.id)}>Edit</button>}
      {onDelete && <button onClick={() => onDelete(user.id)}>Delete</button>}
    </div>
  );
};

// ✅ ПРАВИЛЬНО - использование типов из модуля
import { User } from "@/types/user";

interface UserCardProps {
  user: User;
  onEdit?: (id: number) => void;
}
```

### Деструктуризация props
```typescript
// ✅ ПРАВИЛЬНО - деструктуризация в параметрах
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
}) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
};

// ❌ НЕПРАВИЛЬНО - использование props напрямую
export const Button: React.FC<ButtonProps> = (props) => {
  return (
    <button onClick={props.onClick} disabled={props.disabled}>
      {props.label}
    </button>
  );
};
```

## React Hooks

### useState
```typescript
// ✅ ПРАВИЛЬНО - типизированный useState
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// Generic state
interface FormData {
  name: string;
  email: string;
}

const [formData, setFormData] = useState<FormData>({
  name: "",
  email: "",
});

// ✅ ПРАВИЛЬНО - функциональное обновление state
setCount((prevCount) => prevCount + 1);
setItems((prevItems) => [...prevItems, newItem]);

// ❌ НЕПРАВИЛЬНО - прямая мутация state
items.push(newItem); // Мутирует массив
setItems(items); // Не вызовет ре-рендер
```

### useEffect
```typescript
// ✅ ПРАВИЛЬНО - useEffect с зависимостями
useEffect(() => {
  const fetchUser = async () => {
    const data = await api.getUser(userId);
    setUser(data);
  };
  
  fetchUser();
}, [userId]); // Зависимости указаны явно

// ✅ ПРАВИЛЬНО - cleanup функция
useEffect(() => {
  const subscription = api.subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// ❌ НЕПРАВИЛЬНО - отсутствие зависимостей
useEffect(() => {
  fetchUser(userId); // userId не в зависимостях
}, []); // Ошибка!

// ❌ НЕПРАВИЛЬНО - async в useEffect напрямую
useEffect(async () => {
  const data = await fetchData(); // Нельзя!
}, []);
```

### use() hook (React 19)
```typescript
import { use, Suspense } from 'react';

// ✅ ПРАВИЛЬНО - use() для promises
async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function UserProfile({ userId }: { userId: number }) {
  // use() автоматически suspend-ит компонент
  const user = use(fetchUser(userId));

  return <div>{user.name}</div>;
}

// Использование с Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userId={1} />
    </Suspense>
  );
}

// ✅ ПРАВИЛЬНО - use() для context (условно)
function ThemeButton() {
  const showTheme = useFeatureFlag('showTheme');

  // use() можно вызывать условно!
  if (showTheme) {
    const theme = use(ThemeContext);
    return <button style={{ color: theme.primary }}>Click</button>;
  }

  return <button>Click</button>;
}
```

### useActionState (React 19)
```typescript
import { useActionState } from 'react';

// ✅ ПРАВИЛЬНО - для форм с server actions
interface FormState {
  message: string;
  errors?: string[];
}

async function submitForm(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get('name');

  if (!name) {
    return { message: '', errors: ['Name is required'] };
  }

  await saveToDatabase(name);
  return { message: 'Saved!', errors: [] };
}

function Form() {
  const [state, formAction, isPending] = useActionState(
    submitForm,
    { message: '', errors: [] }
  );

  return (
    <form action={formAction}>
      <input name="name" disabled={isPending} />
      <button disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
      {state.errors?.map(err => <p key={err}>{err}</p>)}
    </form>
  );
}
```

### useOptimistic (React 19)
```typescript
import { useOptimistic } from 'react';

// ✅ ПРАВИЛЬНО - оптимистичные обновления
interface Message {
  id: string;
  text: string;
  sending?: boolean;
}

function Chat({ messages }: { messages: Message[] }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: string) => [
      ...state,
      { id: crypto.randomUUID(), text: newMessage, sending: true },
    ]
  );

  async function sendMessage(formData: FormData) {
    const text = formData.get('message') as string;

    // Показываем сообщение сразу
    addOptimisticMessage(text);

    // Отправляем на сервер
    await api.sendMessage(text);
  }

  return (
    <>
      {optimisticMessages.map(msg => (
        <div key={msg.id} style={{ opacity: msg.sending ? 0.5 : 1 }}>
          {msg.text}
        </div>
      ))}
      <form action={sendMessage}>
        <input name="message" />
        <button>Send</button>
      </form>
    </>
  );
}
```

### useCallback и useMemo
```typescript
// ⚠️ С React Compiler (React 19) - автоматическая мемоизация!
// Явные useMemo/useCallback часто не нужны

// ✅ ПРАВИЛЬНО - без мемоизации (React Compiler оптимизирует)
function List({ items, onSelect }: Props) {
  const handleSelect = (id: string) => {
    onSelect(id);
  };

  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));

  return sortedItems.map(item => (
    <Item key={item.id} onClick={() => handleSelect(item.id)} />
  ));
}

// ✅ ПРАВИЛЬНО - явная мемоизация для тяжёлых вычислений
const expensiveValue = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);

// ✅ ПРАВИЛЬНО - передача мемоизированной функции
<ChildComponent onClick={handleClick} />

// ❌ НЕПРАВИЛЬНО - создание новой функции при каждом рендере
<ChildComponent onClick={() => handleClick()} />
```

### useRef
```typescript
// ✅ ПРАВИЛЬНО - useRef для DOM элементов
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);

<input ref={inputRef} />

// ✅ ПРАВИЛЬНО - useRef для хранения значений
const prevCountRef = useRef<number>();

useEffect(() => {
  prevCountRef.current = count;
}, [count]);

const prevCount = prevCountRef.current;
```

### Кастомные hooks
```typescript
// ✅ ПРАВИЛЬНО - кастомный hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Использование
const { data, loading, error } = useFetch<User>("/api/user");

// ✅ ПРАВИЛЬНО - hook с параметрами
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Использование
const debouncedSearch = useDebounce(searchTerm, 500);
```

## Context API

### Создание и использование Context
```typescript
// ✅ ПРАВИЛЬНО - типизированный Context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const userData = await api.login(email, password);
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook для использования
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  
  return context;
};

// Использование
function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Welcome, {user?.name}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Формы

### Controlled Components
```typescript
// ✅ ПРАВИЛЬНО - контролируемые формы
interface FormData {
  name: string;
  email: string;
  age: number;
}

const Form: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    age: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.submitForm(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        type="number"
        name="age"
        value={formData.age}
        onChange={handleChange}
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### React Hook Form
```typescript
// ✅ ПРАВИЛЬНО - использование React Hook Form
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be at least 18"),
});

type FormData = z.infer<typeof formSchema>;

const Form: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    await api.submitForm(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register("name")} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>
      
      <div>
        <input {...register("email")} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      
      <div>
        <input type="number" {...register("age", { valueAsNumber: true })} />
        {errors.age && <span>{errors.age.message}</span>}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};
```

## Роутинг (React Router)

### Настройка роутов
```typescript
// ✅ ПРАВИЛЬНО - типизированные роуты
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />}>
          <Route path=":userId" element={<UserDetails />} />
        </Route>
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

// ✅ ПРАВИЛЬНО - защищенный роут
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};
```

### Навигация и параметры
```typescript
// ✅ ПРАВИЛЬНО - программная навигация
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const UserDetails: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  
  const tab = searchParams.get("tab") || "profile";
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleEdit = () => {
    navigate(`/users/${userId}/edit`);
  };
  
  return (
    <div>
      <h1>User {userId}</h1>
      <p>Current tab: {tab}</p>
      <button onClick={handleBack}>Back</button>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
};
```

## Стилизация

### CSS Modules
```typescript
// ✅ ПРАВИЛЬНО - CSS Modules
// Button.module.css
.button {
  padding: 10px 20px;
  border-radius: 4px;
}

.primary {
  background-color: #007bff;
  color: white;
}

.secondary {
  background-color: #6c757d;
  color: white;
}

// Button.tsx
import styles from "./Button.module.css";

interface ButtonProps {
  variant: "primary" | "secondary";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
};
```

### Styled Components
```typescript
// ✅ ПРАВИЛЬНО - Styled Components с типами
import styled from "styled-components";

interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
}

const Button = styled.button<ButtonProps>`
  padding: ${(props) => {
    switch (props.size) {
      case "small":
        return "5px 10px";
      case "large":
        return "15px 30px";
      default:
        return "10px 20px";
    }
  }};
  background-color: ${(props) =>
    props.variant === "primary" ? "#007bff" : "#6c757d"};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Использование
<Button variant="primary" size="medium">Click me</Button>
```

### Tailwind CSS
```typescript
// ✅ ПРАВИЛЬНО - Tailwind с clsx
import clsx from "clsx";

interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
}) => {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "rounded font-medium transition-colors",
        {
          "bg-blue-600 text-white hover:bg-blue-700": variant === "primary",
          "bg-gray-600 text-white hover:bg-gray-700": variant === "secondary",
        },
        {
          "px-2 py-1 text-sm": size === "sm",
          "px-4 py-2": size === "md",
          "px-6 py-3 text-lg": size === "lg",
        },
        {
          "opacity-50 cursor-not-allowed": disabled,
        }
      )}
    >
      {children}
    </button>
  );
};
```

## Оптимизация производительности

### React.memo
```typescript
// ✅ ПРАВИЛЬНО - мемоизация компонента
interface UserCardProps {
  user: User;
  onEdit: (id: number) => void;
}

export const UserCard = React.memo<UserCardProps>(({ user, onEdit }) => {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
});

// С кастомным сравнением
export const UserCard = React.memo<UserCardProps>(
  ({ user, onEdit }) => {
    return <div>...</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### Lazy Loading
```typescript
// ✅ ПРАВИЛЬНО - lazy loading компонентов
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));

const App: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
};

// ✅ ПРАВИЛЬНО - lazy loading с retry
function lazyWithRetry(
  componentImport: () => Promise<{ default: React.ComponentType<any> }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      // Retry once
      return await componentImport();
    }
  });
}

const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
```

### Виртуализация списков
```typescript
// ✅ ПРАВИЛЬНО - виртуализация с react-window
import { FixedSizeList } from "react-window";

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

const Row: React.FC<RowProps> = ({ index, style }) => (
  <div style={style}>Row {index}</div>
);

const VirtualList: React.FC<{ items: any[] }> = ({ items }) => {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

## State Management

### Zustand
```typescript
// ✅ ПРАВИЛЬНО - Zustand store
import { create } from "zustand";

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserStore {
  user: User | null;
  users: User[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  users: [],
  isLoading: false,
  
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const users = await api.getUsers();
      set({ users, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
  
  setUser: (user) => set({ user }),
}));

// Использование
const Dashboard: React.FC = () => {
  const { user, users, fetchUsers, isLoading } = useUserStore();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  return <div>{isLoading ? "Loading..." : `${users.length} users`}</div>;
};
```

### Redux Toolkit
```typescript
// ✅ ПРАВИЛЬНО - Redux Toolkit slice
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async () => {
    const response = await api.getUsers();
    return response;
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch users";
      });
  },
});

export const { setCurrentUser } = userSlice.actions;
export default userSlice.reducer;
```

## Error Boundaries

### Обработка ошибок
```typescript
// ✅ ПРАВИЛЬНО - Error Boundary
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <h1>Something went wrong</h1>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Использование
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

## TypeScript конфигурация для React

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"]
    },
    
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    
    "skipLibCheck": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Vite конфигурация

### vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },
  },
});
```

## Best Practices

### Паттерны компонентов
```typescript
// ✅ ПРАВИЛЬНО - Container/Presentational pattern
// Container (логика)
const UserListContainer: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  return <UserList users={users} loading={loading} />;
};

// Presentational (UI)
interface UserListProps {
  users: User[];
  loading: boolean;
}

const UserList: React.FC<UserListProps> = ({ users, loading }) => {
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

### Composition
```typescript
// ✅ ПРАВИЛЬНО - композиция через children
interface CardProps {
  children: React.ReactNode;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, title }) => {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
};

// Использование
<Card title="User Info">
  <UserProfile user={user} />
  <UserActions user={user} />
</Card>

// ✅ ПРАВИЛЬНО - render props
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const { data, loading, error } = useFetch<T>(url);
  return <>{children(data, loading, error)}</>;
}

// Использование
<DataFetcher<User> url="/api/user">
  {(user, loading, error) => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    return <UserProfile user={user!} />;
  }}
</DataFetcher>
```

## Чеклист React/Frontend

- [ ] Функциональные компоненты с hooks
- [ ] Строгая типизация всех props и state
- [ ] Мемоизация дорогих вычислений (useMemo)
- [ ] Мемоизация callback функций (useCallback)
- [ ] React.memo для предотвращения лишних рендеров
- [ ] Lazy loading для роутов
- [ ] Error Boundaries для обработки ошибок
- [ ] Кастомные hooks для переиспользования логики
- [ ] Валидация форм (React Hook Form + Zod)
- [ ] Виртуализация для больших списков
- [ ] CSS Modules или Styled Components
- [ ] Правильная структура проекта
- [ ] Настроенные алиасы импортов
- [ ] Оптимизированная Vite конфигурация
