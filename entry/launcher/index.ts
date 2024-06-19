import {
	initExecuteScriptReceiver,
	openChannelWindow,
} from '@/executeScriptReceiver';

initExecuteScriptReceiver();

const url = 'http://localhost:3100/#/wdb/projects';
// const url = 'http://localhost:5173/#/about';
openChannelWindow(url);
