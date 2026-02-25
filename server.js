const express = require('express')
const app= express()

app.get('/', (req, res) =>  {
    res.send('Hello from express')
})

app.get('/about', (req, res) =>{
    res.send('Hello from about page')
})

app.listen(3000, () => {
    console.log('The server is running')
})c