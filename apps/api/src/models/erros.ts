class ErroHttp extends Error {
    readonly statusCode: number
    constructor(statusCode: number, mensagem: string) {
        super(mensagem);
        this.name = "ErroHttp";
        this.statusCode = statusCode;
    }
}

export { ErroHttp };
