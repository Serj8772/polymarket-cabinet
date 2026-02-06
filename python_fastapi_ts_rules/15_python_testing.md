# Python Testing - Тестирование

## Общие принципы

- **Test Pyramid** - больше unit, меньше integration/e2e
- **AAA Pattern** - Arrange, Act, Assert
- **Изоляция** - тесты не зависят друг от друга
- **Читаемость** - тесты как документация

## Pytest Basics

### Структура тестов
```python
# ✅ ПРАВИЛЬНО - структура теста AAA
import pytest

def test_create_user():
    """Test user creation."""
    # Arrange - подготовка данных
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    
    # Act - выполнение действия
    user = create_user(user_data)
    
    # Assert - проверка результата
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.id is not None
```

### Именование тестов
```python
# ✅ ПРАВИЛЬНО - описательные имена
def test_user_creation_with_valid_data():
    """Test user can be created with valid data."""
    pass

def test_user_creation_fails_with_duplicate_email():
    """Test user creation fails when email already exists."""
    pass

def test_calculate_total_returns_sum_of_prices():
    """Test calculate_total returns correct sum."""
    pass

# ❌ НЕПРАВИЛЬНО - неинформативные имена
def test_user():
    pass

def test_1():
    pass

def test_function():
    pass
```

### Parametrize
```python
# ✅ ПРАВИЛЬНО - параметризованные тесты
@pytest.mark.parametrize(
    "input_value,expected",
    [
        (0, 0),
        (1, 1),
        (2, 4),
        (3, 9),
        (-2, 4),
    ]
)
def test_square(input_value, expected):
    """Test square function with various inputs."""
    assert square(input_value) == expected

# Множественная параметризация
@pytest.mark.parametrize("username", ["user1", "user2", "user3"])
@pytest.mark.parametrize("email_domain", ["gmail.com", "yahoo.com"])
def test_create_users(username, email_domain):
    """Test user creation with different usernames and domains."""
    email = f"{username}@{email_domain}"
    user = create_user(username, email)
    assert user.username == username
    assert user.email == email
```

### Markers
```python
# ✅ ПРАВИЛЬНО - использование маркеров
@pytest.mark.slow
def test_long_running_operation():
    """Test that takes a long time."""
    pass

@pytest.mark.integration
def test_database_integration():
    """Test database integration."""
    pass

@pytest.mark.skipif(sys.version_info < (3, 10), reason="Requires Python 3.10+")
def test_new_feature():
    """Test feature available only in Python 3.10+."""
    pass

@pytest.mark.xfail(reason="Known bug #123")
def test_known_bug():
    """Test for known bug."""
    pass

# Запуск тестов с маркерами
# pytest -m "not slow"  # Пропустить медленные
# pytest -m integration  # Только integration тесты
```

## Fixtures

### Базовые fixtures
```python
# ✅ ПРАВИЛЬНО - переиспользуемые фикстуры
import pytest

@pytest.fixture
def user_data():
    """Fixture with user data."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }

@pytest.fixture
def created_user(user_data):
    """Fixture that creates a user."""
    user = User(**user_data)
    db.add(user)
    db.commit()
    
    yield user
    
    # Cleanup
    db.delete(user)
    db.commit()

def test_user_has_correct_data(created_user):
    """Test user fixture creates user correctly."""
    assert created_user.username == "testuser"
    assert created_user.email == "test@example.com"
```

### Fixture scopes
```python
# ✅ ПРАВИЛЬНО - различные scopes
@pytest.fixture(scope="function")  # По умолчанию, каждый тест
def temp_file():
    """Create temporary file for each test."""
    file = open("temp.txt", "w")
    yield file
    file.close()
    os.remove("temp.txt")

@pytest.fixture(scope="class")  # Для всех тестов в классе
def database_connection():
    """Database connection for test class."""
    conn = create_connection()
    yield conn
    conn.close()

@pytest.fixture(scope="module")  # Для всех тестов в модуле
def api_client():
    """API client for entire test module."""
    client = create_client()
    yield client
    client.close()

@pytest.fixture(scope="session")  # Для всей сессии тестов
def docker_services():
    """Start Docker services once for all tests."""
    subprocess.run(["docker-compose", "up", "-d"])
    yield
    subprocess.run(["docker-compose", "down"])
```

### Автоматические fixtures
```python
# ✅ ПРАВИЛЬНО - autouse fixtures
@pytest.fixture(autouse=True)
def reset_database():
    """Reset database before each test."""
    clear_database()
    seed_test_data()

@pytest.fixture(autouse=True, scope="function")
def log_test_name(request):
    """Log test name."""
    logger.info(f"Running test: {request.node.name}")
```

## Mocking

### unittest.mock
```python
# ✅ ПРАВИЛЬНО - мокирование внешних зависимостей
from unittest.mock import Mock, patch, MagicMock

def test_send_email_with_mock():
    """Test email sending with mock."""
    # Создание mock объекта
    mock_email_service = Mock()
    mock_email_service.send.return_value = True
    
    # Тестирование
    result = send_notification(mock_email_service, "test@example.com", "Hello")
    
    # Проверка что метод был вызван
    mock_email_service.send.assert_called_once_with(
        to="test@example.com",
        subject="Notification",
        body="Hello"
    )
    assert result is True

# Патчинг функций
@patch("app.services.email_service.send_email")
def test_user_registration_sends_email(mock_send_email):
    """Test that user registration sends welcome email."""
    mock_send_email.return_value = True
    
    user = register_user("test@example.com", "password")
    
    assert mock_send_email.called
    assert mock_send_email.call_args[0][0] == "test@example.com"
```

### pytest-mock
```python
# ✅ ПРАВИЛЬНО - использование pytest-mock
def test_fetch_data_with_mock(mocker):
    """Test data fetching with mocker fixture."""
    # Мокируем HTTP запрос
    mock_response = mocker.Mock()
    mock_response.json.return_value = {"data": "test"}
    
    mocker.patch("requests.get", return_value=mock_response)
    
    result = fetch_data("https://api.example.com")
    
    assert result == {"data": "test"}

# Spy - вызов реальной функции с отслеживанием
def test_process_with_spy(mocker):
    """Test with spy."""
    spy = mocker.spy(math, "sqrt")
    
    result = calculate_distance(3, 4)
    
    assert spy.called
    assert result == 5.0
```

## Async Testing

### pytest-asyncio
```python
# ✅ ПРАВИЛЬНО - тестирование async функций
import pytest

@pytest.mark.asyncio
async def test_async_fetch_user():
    """Test async user fetching."""
    user = await fetch_user(1)
    
    assert user.id == 1
    assert user.username == "testuser"

@pytest.mark.asyncio
async def test_async_create_user(async_db):
    """Test async user creation with database."""
    user_data = UserCreate(
        username="newuser",
        email="new@example.com",
        password="password"
    )
    
    user = await user_crud.create(async_db, obj_in=user_data)
    
    assert user.id is not None
    assert user.username == "newuser"

# Async fixtures
@pytest.fixture
async def async_client():
    """Async HTTP client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

## FastAPI Testing

### TestClient
```python
# ✅ ПРАВИЛЬНО - тестирование FastAPI endpoints
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    """Test main endpoint."""
    response = client.get("/")
    
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

def test_create_user():
    """Test user creation endpoint."""
    response = client.post(
        "/users",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "password" not in data  # Пароль не должен возвращаться

def test_get_user_not_found():
    """Test getting non-existent user."""
    response = client.get("/users/999")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
```

### Async TestClient
```python
# ✅ ПРАВИЛЬНО - async тестирование FastAPI
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_user_async():
    """Test async user creation."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/users",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "password123"
            }
        )
    
    assert response.status_code == 201
    assert response.json()["username"] == "testuser"
```

### Dependencies override
```python
# ✅ ПРАВИЛЬНО - переопределение зависимостей
from app.api.deps import get_db, get_current_user

# Mock database
def override_get_db():
    """Override database dependency."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Mock current user
def override_get_current_user():
    """Override current user dependency."""
    return User(id=1, username="testuser", is_superuser=True)

# Применение overrides
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

def test_protected_endpoint():
    """Test protected endpoint with mocked user."""
    response = client.get("/users/me")
    
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

# Очистка после тестов
@pytest.fixture(autouse=True)
def clear_overrides():
    """Clear dependency overrides after each test."""
    yield
    app.dependency_overrides.clear()
```

## Database Testing

### Test database setup
```python
# ✅ ПРАВИЛЬНО - тестовая база данных
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base

TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine."""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    Base.metadata.drop_all(bind=engine)
    os.remove("test.db")

@pytest.fixture
def test_db(test_engine):
    """Get test database session."""
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()
    
    yield db
    
    db.rollback()
    db.close()

def test_user_crud(test_db):
    """Test user CRUD operations."""
    # Create
    user = User(username="test", email="test@example.com")
    test_db.add(user)
    test_db.commit()
    
    # Read
    found_user = test_db.query(User).filter(User.username == "test").first()
    assert found_user.username == "test"
    
    # Update
    found_user.email = "new@example.com"
    test_db.commit()
    assert found_user.email == "new@example.com"
    
    # Delete
    test_db.delete(found_user)
    test_db.commit()
    assert test_db.query(User).filter(User.username == "test").first() is None
```

## Coverage

### pytest-cov
```bash
# Установка
pip install pytest-cov

# Запуск с coverage
pytest --cov=app tests/

# С HTML отчетом
pytest --cov=app --cov-report=html tests/

# Минимальный coverage
pytest --cov=app --cov-fail-under=80 tests/

# Показать непокрытые строки
pytest --cov=app --cov-report=term-missing tests/
```

### .coveragerc
```ini
# ✅ ПРАВИЛЬНО - конфигурация coverage
[run]
source = app
omit =
    */tests/*
    */venv/*
    */__pycache__/*
    */migrations/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
    if TYPE_CHECKING:
    @abstractmethod

precision = 2
```

## Testing Best Practices

### Тест организация
```python
# ✅ ПРАВИЛЬНО - организация тестов
class TestUserCRUD:
    """Test user CRUD operations."""
    
    def test_create_user(self, test_db):
        """Test user creation."""
        pass
    
    def test_get_user(self, test_db):
        """Test getting user."""
        pass
    
    def test_update_user(self, test_db):
        """Test updating user."""
        pass
    
    def test_delete_user(self, test_db):
        """Test deleting user."""
        pass

class TestUserValidation:
    """Test user validation."""
    
    def test_invalid_email(self):
        """Test validation fails with invalid email."""
        pass
    
    def test_short_password(self):
        """Test validation fails with short password."""
        pass
```

### Assertions
```python
# ✅ ПРАВИЛЬНО - четкие assertions
def test_user_creation():
    """Test user creation."""
    user = create_user("test", "test@example.com")
    
    # Конкретные проверки
    assert user.username == "test"
    assert user.email == "test@example.com"
    assert user.id is not None
    assert user.is_active is True
    
    # Проверка исключений
    with pytest.raises(ValueError, match="Email already exists"):
        create_user("test2", "test@example.com")

# pytest.approx для float
def test_calculation():
    """Test float calculation."""
    result = calculate_average([1.0, 2.0, 3.0])
    assert result == pytest.approx(2.0, abs=0.01)

# Проверка коллекций
def test_get_users():
    """Test getting users."""
    users = get_all_users()
    
    assert len(users) == 3
    assert all(isinstance(u, User) for u in users)
    assert {u.username for u in users} == {"user1", "user2", "user3"}
```

### Тест данные
```python
# ✅ ПРАВИЛЬНО - factories для тест данных
import factory

class UserFactory(factory.Factory):
    """Factory for creating test users."""
    
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    password = "password123"
    is_active = True

# Использование
def test_with_factory():
    """Test with factory-generated data."""
    user1 = UserFactory()
    user2 = UserFactory(username="custom")
    users = UserFactory.create_batch(5)
    
    assert user1.username == "user0"
    assert user2.username == "custom"
    assert len(users) == 5
```

## Integration Testing

### API integration tests
```python
# ✅ ПРАВИЛЬНО - интеграционные тесты
@pytest.mark.integration
class TestUserAPI:
    """Integration tests for user API."""
    
    def test_user_registration_flow(self, client):
        """Test complete user registration flow."""
        # 1. Register user
        response = client.post(
            "/register",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 201
        user_id = response.json()["id"]
        
        # 2. Login
        response = client.post(
            "/login",
            data={"username": "new@example.com", "password": "password123"}
        )
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # 3. Get profile
        response = client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["id"] == user_id
```

## Performance Testing

### pytest-benchmark
```python
# ✅ ПРАВИЛЬНО - тестирование производительности
def test_calculation_performance(benchmark):
    """Test calculation performance."""
    result = benchmark(expensive_calculation, 1000)
    assert result > 0

# С setup
def test_with_setup(benchmark):
    """Test with setup."""
    def setup():
        return load_test_data()
    
    def process(data):
        return calculate(data)
    
    result = benchmark.pedantic(
        process,
        setup=setup,
        rounds=100
    )
```

## Conftest.py

### Общие fixtures
```python
# ✅ ПРАВИЛЬНО - conftest.py для общих fixtures
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db

TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def test_engine():
    """Test database engine."""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_db(test_engine):
    """Test database session."""
    TestingSessionLocal = sessionmaker(bind=test_engine)
    db = TestingSessionLocal()
    yield db
    db.rollback()
    db.close()

@pytest.fixture
def client(test_db):
    """Test client with database override."""
    def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()

@pytest.fixture
def auth_client(client, test_user):
    """Authenticated test client."""
    token = create_access_token(test_user.id)
    client.headers = {"Authorization": f"Bearer {token}"}
    return client
```

## Чеклист тестирования

- [ ] Тесты следуют AAA паттерну
- [ ] Описательные имена тестов
- [ ] Fixtures для повторяющихся данных
- [ ] Параметризация для похожих тестов
- [ ] Мокирование внешних зависимостей
- [ ] Async тесты для async кода
- [ ] Тестовая база данных изолирована
- [ ] Coverage > 80%
- [ ] Integration тесты для критичных флоу
- [ ] CI/CD запускает тесты автоматически
