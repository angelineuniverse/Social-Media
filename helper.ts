export const resSuccess = (response: any, msg: string, data: any) => {
    return response.json({
        message: msg ?? '',
        data: data ?? ''
    })
}
export const resFailure = (response: any, msg: string, code: number) => {
    return response.status(code).json({
        message: msg ?? '',
    })
}
export const whiteListImage: Array<String> = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];

export const whiteListVideo: Array<String> = [
    'video/mp4',
    'video/mpeg',
    'video/MPV',
    'video/AV1',
];