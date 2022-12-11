const launchError = (res, code, errorMsg, conn = false) => {
    if (conn) try { conn.end(); } catch { console.log("ah") }
    return res.status(code).send({ error: true, message: errorMsg });
}

export default launchError; 