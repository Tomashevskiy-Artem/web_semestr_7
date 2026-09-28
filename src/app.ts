import fs from 'fs' // модуль для работы с файлами
import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();

const PORT = 3000;

app.use(express.json()); // разложения http-запроса и перевод результата в тело requests.json

// POST - добавление нового пользователя
// curl.exe --location "http://localhost:3000/user" --header "Content-Type: application/json" --data '{\"id\":\"200\",\"username\":\"Coco\",\"senderId\":\"105\",\"senderUsername\":\"Jack5\"}'
app.post('/user', (req: Request, res: Response) => { // URL = /user (POST http://localhost:3000/user)

    // id, username - создаваемый пользователь, senderId, senderUsername - отправитель запроса
    const { id, username, senderId, senderUsername } = req.body;

    if (!id || !username || !senderId || !senderUsername) // если хотя бы одно значение отсутствует
    {
        res.status(400);
        res.send('Требуется id, username, senderId и senderUsername');
        return; // остановка выполнения обработчика
    }

    const rawFileData = fs.readFileSync('database.json', 'utf8');

    const userArray = JSON.parse(rawFileData); // перевод строк из файла в массив объектов

    // поиск подходящего пользователя из файла database.json
    const sender = userArray.find((user: any) => user.id === senderId && user.username === senderUsername);

    if (!sender) // если отправителя нет в файле database.json
    {
        res.status(403);
        res.send('Отправитель не найден в базе данных');
        return;
    }

    // проверка на то, если пользователь, которого мы добавляем уже существует
    const existingUser = userArray.find((user: any) => user.id == id);

    if (existingUser) // если нашли пользователя, то выводим ошибку
    {
        res.status(409);
        res.send(`Пользователь с id = ${id} уже существует`);
        return;
    }

    userArray.push({ id, username }); // добавление пользователя в массив

    // превращение массива обратно в JSON и запись в файл нового пользователя
    fs.writeFileSync('database.json', JSON.stringify(userArray, null, 2), 'utf8');


    const rawLogData = fs.readFileSync('requests.json', 'utf8'); // читаем файл requests.json

    const logArray = JSON.parse(rawLogData); // производим перевод в массив

    // добавление записи
    logArray.push({
        senderId: sender.id,
        senderUsername: sender.username,
        method: 'POST',
        action: `Создан пользователь ${username} (id: ${id})`
    });

    // запись нового объекта в файл
    fs.writeFileSync('requests.json', JSON.stringify(logArray, null, 2), 'utf8');

    console.log(`Пользователь ${sender.username} (id: ${sender.id}) отправил POST. ' + 'Создан пользователь ${username} (id: ${id})`);

    res.send(`Пользователь ${username} с id = ${id} успешно создан`);
});

// GET - получение информации о пользователе
// curl.exe --location "http://localhost:3000/user/106?senderId=101&senderUsername=Tom1"
app.get('/user/:id', (req: Request, res: Response) => {

    const userID = req.params.id; // id пользователя, которого ищем
    const { senderId, senderUsername } = req.query; // данные отправителя

    // проверяем наличие данных отправителя
    if (!senderId || !senderUsername) {
        res.status(400);
        res.send('Требуются senderId и senderUsername');
        return;
    }

    const rawFileData = fs.readFileSync('database.json', 'utf8');

    const userArray = JSON.parse(rawFileData);


    const sender = userArray.find((user: any) => user.id === senderId && user.username === senderUsername); // ищем отправителя

    if (!sender) {
        res.status(403);
        res.send('Отправитель не найден в базе данных');
        return;
    }

    const foundUser = userArray.find((user: any) => user.id === userID); // ищем пользователя, информацию о котором запросили

    // если пользователь не найден
    if (!foundUser) {
        res.status(404);
        res.send(`Пользователь с id = ${userID} не найден`);
        return;
    }

    // читаем журнал
    const rawLogData = fs.readFileSync('requests.json', 'utf8');
    const logArray = JSON.parse(rawLogData);

    logArray.push({
        senderId: sender.id,
        senderUsername: sender.username,
        method: 'GET',
        action: `Получена информация о пользователе ${foundUser.username} (id: ${foundUser.id})`
    });

    fs.writeFileSync('requests.json', JSON.stringify(logArray, null, 2), 'utf8');

    console.log(`Пользователь ${sender.username} (id: ${sender.id}) отправил GET. ` + `Получена информация о пользователе ${foundUser.username} (id: ${foundUser.id})`);

    res.send(`Пользователь с id = ${foundUser.id} найден! ` + `Его юзернейм: ${foundUser.username}`);
});

// DELETE - удаление пользователя
// curl.exe --location --request DELETE "http://localhost:3000/user/106?senderId=101&senderUsername=Tom1"
app.delete('/user/:id', (req: Request, res: Response) => {


    const userID = req.params.id; // id пользователя, которого удаляем
    const { senderId, senderUsername } = req.query;

    // проверяем данные отправителя
    if (!senderId || !senderUsername) {
        res.status(400);
        res.send('Требуются senderId и senderUsername');
        return;
    }

    const rawFileData = fs.readFileSync('database.json', 'utf8');

    const userArray = JSON.parse(rawFileData);

    const sender = userArray.find((user: any) => user.id === senderId && user.username === senderUsername); // ищем отправителя

    if (!sender) {
        res.status(403);
        res.send('Отправитель не найден в базе данных');
        return;
    }

    const foundUser = userArray.find((user: any) => user.id === userID); // ищем удаляемого пользователя

    // пользователь не найден
    if (!foundUser) {
        res.status(404);
        res.send(`Пользователь с id = ${userID} не найден`);
        return;
    }

    const filteredUsers = userArray.filter((user: any) => user.id !== userID); // удаляем пользователя

    fs.writeFileSync('database.json', JSON.stringify(filteredUsers, null, 2), 'utf8');

    const rawLogData = fs.readFileSync('requests.json', 'utf8');

    const logArray = JSON.parse(rawLogData);

    logArray.push({
        senderId: sender.id,
        senderUsername: sender.username,
        method: 'DELETE',
        action: `Удален пользователь ${foundUser.username} (id: ${foundUser.id})`
    });

    fs.writeFileSync('requests.json', JSON.stringify(logArray, null, 2), 'utf8');

    console.log(`Пользователь ${sender.username} (id: ${sender.id}) отправил DELETE. ` + `Удален пользователь ${foundUser.username} (id: ${foundUser.id})`);

    res.send(`Пользователь с id = ${userID} успешно удален`); // ответ клиенту
});

// PATCH - частичное изменение пользователя
// curl.exe --location --request PATCH "http://localhost:3000/user/106" --header "Content-Type: application/json" --data "{\"username\":\"NewAlex\",\"senderId\":\"101\",\"senderUsername\":\"Tom1\"}"
app.patch('/user/:id', (req: Request, res: Response) => {

    const userID = req.params.id; // id изменяемого пользователя
    const { username, senderId, senderUsername } = req.body; // получаем данные из тела запроса

    // проверяем данные
    if (!username || !senderId || !senderUsername) {
        res.status(400);
        res.send('Требуются username, senderId и senderUsername');
        return;
    }

    const rawFileData = fs.readFileSync('database.json', 'utf8');

    const userArray = JSON.parse(rawFileData);

    const sender = userArray.find((user: any) => user.id === senderId && user.username === senderUsername);

    // отправитель не найден
    if (!sender) {
        res.status(403);
        res.send('Отправитель не найден в базе данных');
        return;
    }

    const foundUser = userArray.find((user: any) => user.id === userID);

    // пользователь не найден
    if (!foundUser) {
        res.status(404);
        res.send(`Пользователь с id = ${userID} не найден`);
        return;
    }

    const oldUsername = foundUser.username; // запоминаем старое имя

    foundUser.username = username; // изменяем username

    fs.writeFileSync('database.json', JSON.stringify(userArray, null, 2), 'utf8');

    const rawLogData = fs.readFileSync('requests.json', 'utf8');
    const logArray = JSON.parse(rawLogData);

    // записываем действие
    logArray.push({
        senderId: sender.id,
        senderUsername: sender.username,
        method: 'PATCH',
        action: `Изменен username пользователя с id = ${userID}: ${oldUsername} -> ${username}`
    });

    fs.writeFileSync('requests.json', JSON.stringify(logArray, null, 2), 'utf8');

    console.log(`Пользователь ${sender.username} (id: ${sender.id}) отправил PATCH. ` + `Username пользователя ${userID} изменен: ${oldUsername} -> ${username}`);

    res.send(`Username пользователя с id = ${userID} успешно изменен на ${username}`);
});

app.listen(PORT, () => { console.log(`App listening on ${PORT}`) });