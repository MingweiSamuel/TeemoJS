import nfetch from "node-fetch";

declare global {
    type fetch = typeof nfetch;
}

export {};
