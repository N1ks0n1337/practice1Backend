// Загружаем переменные окружения из файла .env
require('dotenv').config();

// Импортируем Express для роутинга и обработки HTTP-запросов
const express = require('express');
// Импортируем Mongoose для работы с MongoDB
const mongoose = require('mongoose');
// Импортируем CORS, чтобы разрешить запросы с фронтенда
const cors = require('cors');

// Подключаем наши модели данных
const Item = require('./models/Item');
const User = require('./models/User');

// Создаём экземпляр приложения Express
const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────

// 1) Разбираем JSON-тело входящих запросов и кладём его в req.body
app.use(express.json()); // ошибка с тем что у нас не читался JSON в этой строке, мы забыли разбирать JSON

// 2) Включаем CORS, разрешая фронтенду на http://localhost:3000 делать запросы
app.use(cors({ origin: 'http://localhost:3000' }));



// ─── СОЕДИНЕНИЕ С БД ────────────────────────────────────────────

// Подключаемся к MongoDB по URI из .env (база my_prj)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        // Если не удаётся подключиться — завершаем процесс
        process.exit(1);
    });



// ─── ТЕСТОВЫЙ РУТ ────────────────────────────────────────────────

// Простой маршрут, чтобы проверить, что сервер живой
app.get('/', (req, res) => res.send('OK'));



// ─── CRUD ДЛЯ ITEMS ─────────────────────────────────────────────

// GET /items — возвращаем список всех элементов
app.get('/items', async (req, res, next) => {
    try {
        const items = await Item.find();   // запрос всех документов в коллекции items
        res.json(items);                    // возвращаем их в формате JSON
    } catch (err) {
        next(err);                          // передаём ошибку в центральный обработчик
    }
});

// POST /items — создаём новый элемент
app.post('/items', async (req, res, next) => {
    try {
        console.log('BODY item:', req.body);
        // Здесь мы на уровне схемы (в models/Item.js) указали { name: { required: true } }
        // Это гарантирует, что если name не передан — Mongoose выбросит ValidationError.
        const newItem = new Item(req.body);
        const saved = await newItem.save();  // сохраняем в MongoDB
        res.status(201).json(saved);            // отвечаем HTTP 201 Created
    } catch (err) {
        next(err);
    }
});

// PUT /items/:id — обновляем элемент по его _id
app.put('/items/:id', async (req, res, next) => {
    try {
        const updated = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // new: возвращает обновлённый документ; runValidators: проверяет схему при обновлении
        );
        if (!updated) {
            // если элемент с таким id не найден
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// DELETE /items/:id — удаляем элемент по его _id
app.delete('/items/:id', async (req, res, next) => {
    try {
        const removed = await Item.findByIdAndDelete(req.params.id);
        if (!removed) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item removed' });
    } catch (err) {
        next(err);
    }
});



// ─── CRUD ДЛЯ USERS ─────────────────────────────────────────────

// GET /users — возвращаем всех пользователей
app.get('/users', async (req, res, next) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        next(err);
    }
});

// POST /users — создаём нового пользователя
app.post('/users', async (req, res, next) => {
    try {
        console.log('BODY user:', req.body);
        // В модели User (models/User.js) поля username и email помечены required:true
        const newUser = new User(req.body);
        const saved = await newUser.save();
        res.status(201).json(saved);
    } catch (err) {
        next(err);
    }
});

// PUT /users/:id — обновляем пользователя
app.put('/users/:id', async (req, res, next) => {
    try {
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// DELETE /users/:id — удаляем пользователя
app.delete('/users/:id', async (req, res, next) => {
    try {
        const removed = await User.findByIdAndDelete(req.params.id);
        if (!removed) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User removed' });
    } catch (err) {
        next(err);
    }
});



// ─── ОБРАБОТКА ОШИБОК ────────────────────────────────────────────

// Центральный middleware для обработки ошибок
app.use((err, req, res, next) => {
    console.error(err);  // логируем в консоль
    if (err.name === 'ValidationError') {
        // Если ошибка валидации схемы Mongoose (например, не указан name/email)
        return res.status(400).json({ error: err.message });
    }
    // Все прочие ошибки — Internal Server Error
    res.status(500).json({ error: err.message });
});



// ─── СТАРТ СЕРВЕРА ──────────────────────────────────────────────

// Берём порт из .env или дефолтно 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
