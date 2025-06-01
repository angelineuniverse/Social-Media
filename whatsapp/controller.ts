import wppconnect, { Message } from '@wppconnect-team/wppconnect';
import { resFailure, resSuccess, whiteListImage, whiteListVideo } from '../helper.ts';
import moment from 'moment';

class WhatsAppConnection {
    static session: any = null;

    async scanned(req: any, response?: any) {
        const _session = req.body?.session ?? '';
        try {
            return wppconnect.create({
                session: _session,
                catchQR: async (base64Qrimg, asciiQR, attempts, urlCode) => {
                    console.log(asciiQR);
                    await response.json(base64Qrimg)
                },
                statusFind: (statusSession, session) => {
                    console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
                    //Create session wss return "serverClose" case server for close
                    console.log('Session name: ', session);
                },
                headless: true, // Headless chrome
                devtools: false, // Open devtools by default
                useChrome: false, // If false will use Chromium instance
                debug: true, // Opens a debug session
                logQR: false, // Logs QR automatically in terminal
                browserArgs: [''], // Parameters to be added into the chrome browser instance
                deviceName: 'Angeline Support',
                whatsappVersion: null,
                puppeteerOptions: {
                    userDataDir: `./whatsapp/token/${_session}`
                }, // Will be passed to puppeteer.launch
                tokenStore: 'file',
                folderNameToken: `./whatsapp/token`,
                disableWelcome: true, // Option to disable the welcoming message which appears in the beginning
                updatesLog: true, // Logs info updates automatically in terminal
                autoClose: 10000, // Automatically closes the wppconnect only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
            }).then((res: any) => {
                WhatsAppConnection.session = res;
                return response.json({
                    'isLogged:' : res.isLogged
                })
            }).catch((err) => {
                return console.log(err,"error");
            })
        } catch (error) {
            return console.log("ERROR : ", error);
            
        }
    }
    async logout(request: any, response: any) {
        await WhatsAppConnection.session.logout().then((res: any) => {
            return resSuccess(response, "Logout !", "Success Logout your Whatsapp");
        })
    }
    async host(req: any, response: any) {
        try {
            switch (req.body.types) {
                case 'version':
                    await WhatsAppConnection.session.getWAVersion().then((res: any) => {
                        return resSuccess(response, "WhatsApp Version", res);
                    })
                    break;
                case 'online':
                    await WhatsAppConnection.session.isOnline().then((res: any) => {
                        return resSuccess(response, "Is Online", res);
                    })
                    break;
                case 'battery':
                    await WhatsAppConnection.session.getBatteryLevel().then((res: any) => {
                        return resSuccess(response, "Battery Level", res);
                    })
                    break;
                case 'device':
                    await WhatsAppConnection.session.getHostDevice().then((res: any) => {
                        return resSuccess(response, "Device", res);
                    })
                    break;
                default:
                    await WhatsAppConnection.session.isLoggedIn().then((res: any) => {
                        return resSuccess(response, "Is Login", res);
                    })
                    break;
            }
            
        } catch (error) {
            return response.resFailure(500, error);
        }
    }
    async getAllChats(request?: any,response?: any) {
        const _listchat: any = await WhatsAppConnection.session.listChats(request?.query);
        return response.json(_listchat);
    }
    async getChatbyId(request?: any,response?: any) {
        const _chat: any = await WhatsAppConnection.session.getChatById(request?.query?.contactId);
        return response.json(_chat);
    }
    async deleteChat(request?: any,response?: any) {
        const _chat: any = await WhatsAppConnection.session.deleteChat(request?.body.chatId);
        return response.json(_chat);
    }
    async onMessage(req: any, response?: any) {
        await WhatsAppConnection.session.onMessage((msg: Message) => {
            response.json(msg); 
        })
    }
    async sendMessage(request?: any, response?: any) { 
        const _types = request.body?.types;
        if (_types == undefined) return response.status(500).json({
            message: "You must add types request !"
        });

        const _session = await WhatsAppConnection.session;
        const _number = request.body?.number;
        const _body = request.body?.body ?? '';
        const _title = request.body?.title ?? '';
        const _footer = request.body?.footer ?? '';
        const _chatid = request.body?.chatid ?? '';
        const _button = request.body?.button ?? Array();
        const _url = request.body?.url ?? '';

        try {
            switch (_types) {
                case 'button':
                    _session.sendText(`${_number}@c.us`, _body, {
                        useTemplateButtons: true,
                        buttons: _button,
                        title: _title,
                        footer: _footer
                    }).then((res: any) => {
                        return response.json(res);
                    }).catch((err: any) => {
                        return response.status(500).json(err);
                     })
                    break;
                case 'reply':
                    _session.sendText(`${_number}@c.us`, _body, {
                        quotedMsg: _chatid
                    }).then((res: any) => {
                        return response.json(res);
                    }).catch((err: any) => {
                        return response.status(500).json(err);
                     })
                    break;
                case 'location':
                    const _lat = request.body?.lat ?? '';
                    const _lng = request.body?.lng ?? '';
                    _session.sendLocation(_number, {
                        lat: _lat,
                        lng: _lng,
                        url: _url
                    }).then((res: any) => {
                        return response.json(res);
                    }).catch((err: any) => {
                        return response.status(500).json(err);
                     })
                    break;
                case 'link':
                    _session.sendLinkPreview(_number, _url, _body).then((res: any) => {
                        return response.json(res);
                    }).catch((err: any) => {
                        return response.status(500).json(err);
                     })
                    break;
                case 'image':
                    await request.files.forEach(async (file: any, index: number) => {
                        if (!whiteListImage.includes(file.mimetype)) return resFailure(response, 'Only support send with image type', 500);
                        await WhatsAppConnection.session.sendImage(_number, file.path, file.filename, index < 1 ? _body : '').then((res: any) => {
                            return resSuccess(response, "send image", res);
                        })
                    });
                    break;
                case 'file':
                    await request.files.forEach(async (file: any , index: number) => {
                        await WhatsAppConnection.session.sendFile(_number, file.path, file.filename, index < 1 ? _body : '').then((res: any) => {
                            return resSuccess(response, "send files", res);
                        })
                    });
                    break;
                case 'audio':
                    await request.files.forEach(async (file: any , index: number) => {
                        await WhatsAppConnection.session.sendPtt(_number, file.path, file.filename, index < 1 ? _body : '').then((res: any) => {
                            return resSuccess(response, "send audio", res);
                        })
                    });
                    break;
                default:
                    _session.sendText(`${_number}@c.us`, _body).then((res: any) => {
                        return response.json(res);
                    }).catch((err: any) => {
                        return response.status(500).json(err);
                     })
                    break;
            }
        } catch (error) {
            return resFailure(response, error, 500)
        }
    }
    async getMessages(request?: any, response?: any) {
        const _allmessage = await WhatsAppConnection.session.getMessages(request?.body?.chatid, request?.query);
        for await (const element of _allmessage){
            if (element.hasReaction) {
                const _reaction = await WhatsAppConnection.session.getReactions(element.id)
                element['reaction'] = _reaction;
            }
        };
        return response.json(_allmessage);
    }
    async deleteMessage(request?: any, response?: any) {
        const _deleted = await WhatsAppConnection.session.deleteMessage(request?.body.chatId, request?.body.messageId, request?.body.onlyLocal ?? false, request?.body.deleteMediaInDevice ?? true);
        return response.json(_deleted)
    }
    async getAllUnreadMessages(request?: any, response?: any) {
        const _unread = await WhatsAppConnection.session.getAllUnreadMessages();
        return response.json(_unread)
    }
    async onReactionMessage(request?: any, response?: any) {
        await WhatsAppConnection.session.onReactionMessage((reaction: any) => {
            response.json(reaction)
        })
    }
    async getReactions(request?: any, response?: any) {
        const _reaction = await WhatsAppConnection.session.getReactions(request?.query.messageId);
        return response.json(_reaction)
    }
    async sendReactionToMessage(request?: any, response?: any) {
        const _reaction = await WhatsAppConnection.session.sendReactionToMessage(request?.body.id, request?.body?.reaction);
        return response.json({
            status: true
        })
    }
    

    /** PROFILE CONFIGURATION */
    async getName(request:any, response?: any) {
        const _name: any = await WhatsAppConnection.session.getProfileName();
        return resSuccess(response, 'Profile Name', _name)
    }
    async getStatus(request:any, response?: any) {
        const _status: any = await WhatsAppConnection.session.getProfileStatus();
        return resSuccess(response, 'Profile Status', _status)
    }
    async setName(request: any, response?: any) {
        if (request.body?.name == undefined) return resFailure(response, "You must add field name", 500);
        const _name: any = await WhatsAppConnection.session.setProfileName(request.body?.name);
        return resSuccess(response, 'Set Profile Name', _name)
    }
    async setStatus(request: any, response?: any) {
        if (request.body?.status == undefined) return resFailure(response, "You must add field status", 500);
        const _status: any = await WhatsAppConnection.session.setProfileStatus(request.body?.status);
        return resSuccess(response, 'Set Profile Status', _status)
    }
    async removePicture(request:any, response?: any) {
        const _status: any = await WhatsAppConnection.session.removeMyProfilePicture();
        return resSuccess(response, 'Profile Remove Picture', _status)
    }
    async setPicture(request: any, response?: any) {
        const _number = request.body?.number;
        await WhatsAppConnection.session.setProfilePic(request.file?.path).then((res: any) => {
            return resSuccess(response, 'Set Profile Status', res)
        })
    }

    /** LABEL */
    async getAllLabel(request: any, response?: any) {
        const _label: any = await WhatsAppConnection.session.getAllLabels();
        return resSuccess(response, 'Get Label', _label)
    }
    async getLabelbyId(request: any, response?: any) {
        const _label: any = await WhatsAppConnection.session.getLabelById(request?.query?.id);
        return resSuccess(response, 'Get Label', _label)
    }
    async addLabel(request: any, response?: any) {
        if (request.body?.name == undefined) return resFailure(response, "You must add field name", 500);
        try {
            await WhatsAppConnection.session.addNewLabel("testing", { labelColor: '#dfaef0' });
            return resSuccess(response, 'Add Label', "Success Add Label !")
        } catch (error) {
            throw new Error(error);
        }
    }
    async onUpdateLabel(request: any, response?: any) {
        await WhatsAppConnection.session.onUpdateLabel((res: any) => {
            return resSuccess(response, 'onUpdateLabel Label', res)
        });
    }
    async addOrRemoveLabel(request: any, response: any) {
        try {
            await WhatsAppConnection.session.addOrRemoveLabels('628983554798@c.us', 
                { labelId:'1', type:'add' }
            ).then((res: any) => {
                return resSuccess(response, 'addOrRemoveLabel', res)
            })
        } catch (error) {
            throw new Error(error);
        }
    }
    async deleteLabel(request: any, response: any) {
        try {
            await WhatsAppConnection.session.deleteLabel(request.body?.labelId).then((res: any) => {
                return resSuccess(response, "Deleted Label", res);
            })
        } catch (error) {
            throw new Error(error)
        }
    }

    /** Contact */
    async allContact(request: any, response: any) {
        await WhatsAppConnection.session.getAllContacts().then((res: any) => {
            const _output = res.filter((contact: any) => { return contact?.id?.server !== 'lid' })
            return resSuccess(response, "All Contact", _output);
        })
    }
    async getContact(request:any, response?: any) {
        const _contact: any = await WhatsAppConnection.session.getContact(request?.body?.number);
        return resSuccess(response, 'Contact Detail', _contact)
    }
    async getValidContact(request:any, response?: any) {
        const _contact: any = await WhatsAppConnection.session.getNumberProfile(request?.body?.number);
        return resSuccess(response, 'Contact Valid Whatsapp', _contact)
    }

    /** Status Message */
    async addImageWithCaption(request: any, response?: any) {
        await request.files.forEach(async (file: any, index: number) => {
            if (!whiteListImage.includes(file.mimetype)) return resFailure(response, 'Only support send with image type', 500);
            await WhatsAppConnection.session.sendImageStatus(file.path, { caption: index < 1 ? request?.body?.caption : '' });
        });
        return resSuccess(response, 'Send Status Success', true);
    }
    async addText(request: any, response?: any) {
        const _body = request.body?.body ?? '';
        const _font = request.body?.font ?? 1;
        const _bg = request.body?.backgroundColor ?? '#0275d8';
        await WhatsAppConnection.session.sendTextStatus(`${_body}`, { backgroundColor: _bg, font: _font}).then((res: any) => {
            return resSuccess(response, 'Send Status Success', res);
        });
    }
    async addVideo(request: any, response?: any) {
        await request.files.forEach(async (file: any, index: number) => {
            if (!whiteListVideo.includes(file.mimetype)) return resFailure(response, 'Only support send with video type', 500);
            await WhatsAppConnection.session.sendVideoStatus(file.path, { caption: index < 1 ? request?.body?.caption : '' });
        });
        return resSuccess(response, 'Send Status Success', true);
    }


    /** Custom Report Wa by Date for Anisa */
    async reportMessage(request: any, response?: any) {
        const _allmessage = await WhatsAppConnection.session.listChats(request?.query);
        const _label: any = await WhatsAppConnection.session.getAllLabels();
        if (_allmessage) {
            let datas: Array<any> = [];

            for (const element of _allmessage) {
                
                let labelName: string = '';
                let name: string = '';
                if (element?.contact?.pushname) {
                    name = await element?.contact?.pushname
                }
                if (element?.labels?.length > 0) {
                    if (_label) {
                        const find = _label.find((item: any) => item.id === element?.labels[0])
                        labelName = find?.name
                    }
                }
                let filterConvertation: any = null;
                if (request?.body?.start_date && request?.body?.end_date) {
                    const _getmessage = await WhatsAppConnection.session.getMessages(element?.id?._serialized, { count: request?.query?.total_convertation ?? 10 });
                    filterConvertation = _getmessage.reverse().filter((item: any) => {
                        const itemDate = moment(element.t, 'X').format('DD/MM/YYYY');
                        return (
                            parseDateString(itemDate) >= parseDateString(request?.body?.start_date) && parseDateString(itemDate) <= parseDateString(request?.body?.end_date) && item.ctwaContext != undefined
                        )
                    })
                }

                const t = moment(element.t,'X').format('DD/MM/YYYY H:mm:ss');
                
                if (filterConvertation.length > 0 && parseDateString(moment(filterConvertation[0].t, 'X').format('DD/MM/YYYY'))
                    >= parseDateString(request?.body?.start_date) &&
                    parseDateString(moment(filterConvertation[0].t, 'X').format('DD/MM/YYYY'))
                    <= parseDateString(request?.body?.end_date)
                ) {
                    datas.push({
                        "terakhir_convertation": t,
                        "chat_terakhir_cust_sudah_dibalas ?": element?.lastReceivedKey?.fromMe ? 'Ya' : 'Tidak',
                        'contact_pengirim': element?.id?.user,
                        "nama_pengirim": name,
                        "label_contact": labelName,
                        "convertation_start_when_click_last_template": moment(filterConvertation[0].t, 'X').format('DD/MM/YYYY H:mm:ss'),
                        "body_last_template": filterConvertation[0].body,
                        "count_template_click": filterConvertation.length,
                    })
                }
            };

            return response.status(200).json({
                total_chat: datas.length,
                data: datas
            })
        }
        return response.status(500).json("failure")
    }
}

function parseDateString(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day); // Month dimulai dari 0 (Jan = 0)
}

export default WhatsAppConnection;