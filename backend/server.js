import express from 'express'


// create express app
const app = express()

app.get('/', (req, res) => {
    res.json({mssg: "Welcome to the app"})
})

// listen for any requests
app.listen(4000, () => {
    console.log('listening on port 4000!')
})





