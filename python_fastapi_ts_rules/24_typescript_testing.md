# TypeScript Testing - Тестирование

## Общие принципы

- **Test-Driven Development** - пишите тесты перед кодом (где возможно)
- **Arrange-Act-Assert** - структура теста
- **FIRST** - Fast, Independent, Repeatable, Self-validating, Timely
- **Coverage** - стремитесь к 80%+ покрытию кода
- **Realistic Tests** - тесты должны отражать реальное использование

## Настройка тестового окружения

### Vitest (рекомендуется для Vite проектов)
```bash
# Установка
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
```

### vitest.config.ts
```typescript
// ✅ ПРАВИЛЬНО - конфигурация Vitest
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Setup файл
```typescript
// src/test/setup.ts
// ✅ ПРАВИЛЬНО - настройка testing library
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Моки глобальных объектов
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  };
};
```

### package.json scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Unit тесты

### Тестирование утилит
```typescript
// ✅ ПРАВИЛЬНО - тест утилиты
// utils/formatters.ts
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// utils/formatters.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "./formatters";

describe("formatCurrency", () => {
  it("форматирует сумму в USD по умолчанию", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("форматирует сумму в указанной валюте", () => {
    expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
  });

  it("обрабатывает нулевую сумму", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("обрабатывает отрицательные суммы", () => {
    expect(formatCurrency(-100)).toBe("-$100.00");
  });
});

describe("formatDate", () => {
  it("форматирует дату корректно", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("January 15, 2024");
  });
});
```

### Тестирование классов
```typescript
// ✅ ПРАВИЛЬНО - тест класса
// services/Calculator.ts
export class Calculator {
  private history: number[] = [];

  add(a: number, b: number): number {
    const result = a + b;
    this.history.push(result);
    return result;
  }

  subtract(a: number, b: number): number {
    const result = a - b;
    моки;
    return result;
  }

  getHistory(): number[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

// services/Calculator.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { Calculator } from "./Calculator";

describe("Calculator", () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe("add", () => {
    it("складывает два числа", () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it("добавляет результат в историю", () => {
      calculator.add(2, 3);
      expect(calculator.getHistory()).toEqual([5]);
    });
  });

  describe("subtract", () => {
    it("вычитает два числа", () => {
      expect(calculator.subtract(5, 3)).toBe(2);
    });
  });

  describe("history", () => {
    it("сохраняет все операции", () => {
      calculator.add(1, 2);
      calculator.subtract(5, 3);
      expect(calculator.getHistory()).toEqual([3, 2]);
    });

    it("очищает историю", () => {
      calculator.add(1, 2);
      calculator.clearHistory();
      expect(calculator.getHistory()).toEqual([]);
    });
  });
});
```

## Тестирование React компонентов

### Простые компоненты
```typescript
// ✅ ПРАВИЛЬНО - тест компонента
// components/Button.tsx
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
  variant = "primary",
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

// components/Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("рендерит с правильным текстом", () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("вызывает onClick при клике", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button label="Click me" onClick={handleClick} />);
    await user.click(screen.getByRole("button"));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("применяет правильный класс для variant", () => {
    render(<Button label="Click me" onClick={() => {}} variant="secondary" />);
    expect(screen.getByRole("button")).toHaveClass("btn-secondary");
  });

  it("disabled кнопка не вызывает onClick", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button label="Click me" onClick={handleClick} disabled />);
    await user.click(screen.getByRole("button"));
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### Компоненты с состоянием
```typescript
// ✅ ПРАВИЛЬНО - тест компонента с состоянием
// components/Counter.tsx
export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};

// components/Counter.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("начинается с нуля", () => {
    render(<Counter />);
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });

  it("увеличивает счетчик", async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
    
    await user.click(screen.getByRole("button", { name: /increment/i }));
    expect(screen.getByText(/count: 2/i)).toBeInTheDocument();
  });

  it("уменьшает счетчик", async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    await user.click(screen.getByRole("button", { name: /decrement/i }));
    expect(screen.getByText(/count: -1/i)).toBeInTheDocument();
  });

  it("сбрасывает счетчик", async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    await user.click(screen.getByRole("button", { name: /increment/i }));
    await user.click(screen.getByRole("button", { name: /increment/i }));
    await user.click(screen.getByRole("button", { name: /reset/i }));
    
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });
});
```

### Компоненты с формами
```typescript
// ✅ ПРАВИЛЬНО - тест формы
// components/LoginForm.tsx
interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
};

// components/LoginForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("отправляет форму с правильными данными", async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith("test@example.com", "password123");
  });

  it("не отправляет форму с пустыми полями", async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={handleSubmit} />);
    await user.click(screen.getByRole("button", { name: /login/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith("", "");
  });
});
```

### Компоненты с асинхронными операциями
```typescript
// ✅ ПРАВИЛЬНО - тест асинхронного компонента
// components/UserProfile.tsx
interface User {
  id: number;
  name: string;
  email: string;
}

export const UserProfile: React.FC<{ userId: number }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError("Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

// components/UserProfile.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { UserProfile } from "./UserProfile";

describe("UserProfile", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("показывает загрузку", () => {
    (global.fetch as any).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<UserProfile userId={1} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("отображает данные пользователя", async () => {
    const mockUser = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockUser,
    });

    render(<UserProfile userId={1} />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  it("показывает ошибку при неудачной загрузке", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(<UserProfile userId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch user/i)).toBeInTheDocument();
    });
  });
});
```

## Тестирование Hooks

### Кастомные hooks
```typescript
// ✅ ПРАВИЛЬНО - тест кастомного hook
// hooks/useCounter.ts
export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount((c) => c - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

// hooks/useCounter.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("инициализируется с заданным значением", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it("увеличивает счетчик", () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it("уменьшает счетчик", () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  it("сбрасывает к начальному значению", () => {
    const { result } = renderHook(() => useCounter(10));
    
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });
    
    expect(result.current.count).toBe(10);
  });
});
```

### Hooks с зависимостями
```typescript
// ✅ ПРАВИЛЬНО - тест hook с зависимостями
// hooks/useFetch.ts
export function useFetch<T>(url: string) {
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

// hooks/useFetch.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "./useFetch";

describe("useFetch", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("возвращает данные после успешной загрузки", async () => {
    const mockData = { id: 1, name: "Test" };
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { result } = renderHook(() => useFetch("/api/test"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  it("обрабатывает ошибки", async () => {
    const mockError = new Error("Network error");
    (global.fetch as any).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useFetch("/api/test"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toEqual(mockError);
    });
  });

  it("перезагружает данные при изменении URL", async () => {
    const mockData1 = { id: 1 };
    const mockData2 = { id: 2 };

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockData1 })
      .mockResolvedValueOnce({ json: async () => mockData2 });

    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: "/api/test/1" } }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    rerender({ url: "/api/test/2" });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });
  });
});
```

## Моки и стабы

### Мокирование функций
```typescript
// ✅ ПРАВИЛЬНО - мокирование функций
import { describe, it, expect, vi } from "vitest";

describe("Function mocking", () => {
  it("мокирует простую функцию", () => {
    const mockFn = vi.fn();
    mockFn("hello");
    
    expect(mockFn).toHaveBeenCalledWith("hello");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("мокирует функцию с возвращаемым значением", () => {
    const mockFn = vi.fn().mockReturnValue(42);
    
    expect(mockFn()).toBe(42);
  });

  it("мокирует асинхронную функцию", async () => {
    const mockFn = vi.fn().mockResolvedValue({ id: 1, name: "Test" });
    
    const result = await mockFn();
    expect(result).toEqual({ id: 1, name: "Test" });
  });

  it("мокирует последовательные вызовы", () => {
    const mockFn = vi.fn()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValue(3);
    
    expect(mockFn()).toBe(1);
    expect(mockFn()).toBe(2);
    expect(mockFn()).toBe(3);
    expect(mockFn()).toBe(3);
  });
});
```

### Мокирование модулей
```typescript
// ✅ ПРАВИЛЬНО - мокирование модулей
// services/api.ts
export async function getUser(id: number) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

export async function createUser(data: { name: string; email: string }) {
  const response = await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.json();
}

// services/UserService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "./api";
import { UserService } from "./UserService";

vi.mock("./api");

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("получает пользователя", async () => {
    const mockUser = { id: 1, name: "John" };
    vi.mocked(api.getUser).mockResolvedValue(mockUser);

    const user = await UserService.fetchUser(1);

    expect(api.getUser).toHaveBeenCalledWith(1);
    expect(user).toEqual(mockUser);
  });

  it("создает пользователя", async () => {
    const newUser = { name: "Jane", email: "jane@example.com" };
    const mockResponse = { id: 2, ...newUser };
    
    vi.mocked(api.createUser).mockResolvedValue(mockResponse);

    const user = await UserService.createUser(newUser);

    expect(api.createUser).toHaveBeenCalledWith(newUser);
    expect(user).toEqual(mockResponse);
  });
});
```

### Мокирование локального хранилища
```typescript
// ✅ ПРАВИЛЬНО - мокирование localStorage
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("localStorage", () => {
  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    global.localStorage = localStorageMock as any;
  });

  it("сохраняет данные в localStorage", () => {
    const data = { key: "value" };
    localStorage.setItem("data", JSON.stringify(data));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "data",
      JSON.stringify(data)
    );
  });

  it("получает данные из localStorage", () => {
    const data = { key: "value" };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(data));

    const result = JSON.parse(localStorage.getItem("data") || "{}");

    expect(result).toEqual(data);
  });
});
```

## Integration тесты

### Тестирование взаимодействия компонентов
```typescript
// ✅ ПРАВИЛЬНО - integration тест
// components/TodoList.tsx
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput("");
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add todo"
      />
      <button onClick={addTodo}>Add</button>
      
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// components/TodoList.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoList } from "./TodoList";

describe("TodoList integration", () => {
  it("полный flow: добавление, выполнение и удаление todo", async () => {
    const user = userEvent.setup();
    render(<TodoList />);

    // Добавление todo
    const input = screen.getByPlaceholderText(/add todo/i);
    await user.type(input, "Buy milk");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(input).toHaveValue("");

    // Добавление еще одного todo
    await user.type(input, "Walk dog");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.getByText("Walk dog")).toBeInTheDocument();

    // Отметка todo как выполненного
    const checkbox = screen.getAllByRole("checkbox")[0];
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText("Buy milk")).toHaveStyle({
      textDecoration: "line-through",
    });

    // Удаление todo
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
    expect(screen.getByText("Walk dog")).toBeInTheDocument();
  });

  it("не добавляет пустые todo", async () => {
    const user = userEvent.setup();
    render(<TodoList />);

    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
```

## E2E тесты с Playwright

### Установка Playwright
```bash
npm install -D @playwright/test
npx playwright install
```

### playwright.config.ts
```typescript
// ✅ ПРАВИЛЬНО - конфигурация Playwright
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E тесты
```typescript
// ✅ ПРАВИЛЬНО - E2E тест
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("успешный логин", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome");
  });

  test("неудачный логин с неверными данными", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error")).toContainText("Invalid credentials");
    await expect(page).toHaveURL("/login");
  });

  test("переход на страницу регистрации", async ({ page }) => {
    await page.goto("/login");

    await page.click('a[href="/register"]');

    await expect(page).toHaveURL("/register");
    await expect(page.locator("h1")).toContainText("Register");
  });
});

// e2e/todo.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Todo App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/todos");
  });

  test("создание нового todo", async ({ page }) => {
    await page.fill('input[placeholder="Add todo"]', "Buy groceries");
    await page.click('button:has-text("Add")');

    await expect(page.locator("li")).toContainText("Buy groceries");
  });

  test("выполнение todo", async ({ page }) => {
    // Добавляем todo
    await page.fill('input[placeholder="Add todo"]', "Task to complete");
    await page.click('button:has-text("Add")');

    // Отмечаем как выполненное
    await page.check('input[type="checkbox"]');

    await expect(page.locator("li span")).toHaveCSS(
      "text-decoration",
      /line-through/
    );
  });

  test("удаление todo", async ({ page }) => {
    await page.fill('input[placeholder="Add todo"]', "Task to delete");
    await page.click('button:has-text("Add")');

    await page.click('button:has-text("Delete")');

    await expect(page.locator("li")).not.toContainText("Task to delete");
  });
});
```

## Coverage

### Настройка coverage
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### Запуск coverage
```bash
# Генерация отчета
npm run test:coverage

# Просмотр HTML отчета
open coverage/index.html
```

## Best Practices

### AAA паттерн (Arrange-Act-Assert)
```typescript
// ✅ ПРАВИЛЬНО - AAA паттерн
it("добавляет товар в корзину", async () => {
  // Arrange - подготовка
  const user = userEvent.setup();
  const mockProduct = { id: 1, name: "Laptop", price: 1000 };
  render(<ProductCard product={mockProduct} />);

  // Act - действие
  await user.click(screen.getByRole("button", { name: /add to cart/i }));

  // Assert - проверка
  expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
});
```

### Описательные названия тестов
```typescript
// ✅ ПРАВИЛЬНО - описательные названия
describe("Button", () => {
  it("вызывает onClick при клике на кнопку", () => {});
  it("не вызывает onClick когда кнопка disabled", () => {});
  it("применяет правильный CSS класс для primary variant", () => {});
});

// ❌ НЕПРАВИЛЬНО - неясные названия
describe("Button", () => {
  it("работает", () => {});
  it("тест 1", () => {});
  it("проверка", () => {});
});
```

### Избегайте магических чисел
```typescript
// ✅ ПРАВИЛЬНО - константы
const DEBOUNCE_DELAY = 500;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;

it("debounce срабатывает после задержки", async () => {
  vi.useFakeTimers();
  // ... test code
  vi.advanceTimersByTime(DEBOUNCE_DELAY);
});

// ❌ НЕПРАВИЛЬНО
it("debounce works", async () => {
  vi.useFakeTimers();
  vi.advanceTimersByTime(500); // Что за 500?
});
```

### Изолированные тесты
```typescript
// ✅ ПРАВИЛЬНО - каждый тест независим
describe("User Service", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it("создает пользователя", () => {
    service.createUser({ name: "John" });
    expect(service.getUsers()).toHaveLength(1);
  });

  it("удаляет пользователя", () => {
    service.createUser({ name: "John" });
    service.deleteUser(1);
    expect(service.getUsers()).toHaveLength(0);
  });
});

// ❌ НЕПРАВИЛЬНО - тесты зависят друг от друга
describe("User Service", () => {
  const service = new UserService(); // Общий для всех

  it("создает пользователя", () => {
    service.createUser({ name: "John" });
  });

  it("удаляет пользователя", () => {
    // Зависит от предыдущего теста!
    service.deleteUser(1);
  });
});
```

## Чеклист TypeScript Testing

- [ ] Vitest/Jest настроен и работает
- [ ] Testing Library для React компонентов
- [ ] Unit тесты для утилит и функций
- [ ] Integration тесты для взаимодействия компонентов
- [ ] E2E тесты для критических flow
- [ ] Тесты для кастомных hooks
- [ ] Мокирование внешних зависимостей
- [ ] AAA паттерн в тестах
- [ ] Описательные названия тестов
- [ ] Изолированные тесты (beforeEach)
- [ ] Coverage > 80%
- [ ] Тесты запускаются в CI/CD
- [ ] Playwright для E2E тестов
- [ ] Snapshot тесты где уместно
- [ ] Тестирование edge cases
