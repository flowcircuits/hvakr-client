declare module 'zod/v4/core' {
    interface GlobalMeta {
        /** Omit this field from normal user-controlled project writes. */
        disableUserWrite?: true
    }
}

export {}
