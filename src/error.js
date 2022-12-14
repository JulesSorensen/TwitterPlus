const launchError = (res, code, errorMsg, conn = false) => {
    if (conn) conn.end();
    return res.status(code).send({ error: true, message: errorMsg });
}

export default launchError; 