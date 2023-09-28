const express = require("express");
const app = express();
const port = 3001;
app.listen(port, ()=>{"Listening on port" + port});
app.get("/", (req,res) => {
	res.send("shiftschdule API");
})