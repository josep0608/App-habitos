const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const logger = require('morgan');
const cors = require('cors'); 
const userRoutes = require('./routes/userRoutes');
const personalizationRoutes = require('./routes/personalizationRoutes');
const taskRoutes = require('./routes/taskRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const stateRoutes = require('./routes/stateRoutes');
const authRoutes = require('./routes/authRoutes');
const geminiAssistantRoutes = require('./routes/groqAssistantRoutes');
const port = process.env.PORT || 3001;
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors());
app.disable('x-powered-by');

app.set('port', port);
userRoutes(app);
personalizationRoutes(app);
taskRoutes(app);
premiumRoutes(app);
stateRoutes(app);
authRoutes(app);
geminiAssistantRoutes(app);

server.listen(port, '192.168.40.150' || 'localhost', function () {
  console.log('Aplicación de Node.js Iniciada...');
});
app.get('/',(req, res)=>{
    res.send('ruta raiz');
});
app.get('/test',(req, res)=>{
    res.send('pruebas');
});
app.use((err,req,res,next)=>{
    console.log(err);
    res.status(err.status || 500).send(err.stack);
});
