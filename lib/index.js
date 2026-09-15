import makeWASocket from './Socket/index.js';
import chalk from "chalk";

console.log(chalk.bold.gray("-----------------------------------------\n"));
console.log(chalk.bold.cyan(`
⠀⠀⠀⠀⣠⣤⣶⣶⣶⣤⣄⡀⠀
⠀⠀⣴⣾⣿⣿⣿⣿⣿⣧⡀⠈⠢
⠀⣼⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀
⢰⡿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀
⠘⣽⡿⠿⠿⣿⣿⣿⣿⣿⣦⣤⡀
⠀⣟⠀⠀⠀⣸⣿⡏⠀⠀⠀⢹⠗
⠀⣿⣷⣶⣾⡿⠁⠙⣄⣀⣀⣠⡀
⠀⠙⠙⢿⡿⣷⣶⣤⣿⣿⡿⠿⠃
⠀⠀⠀⠺⡏⡏⡏⡏⡏⠉⠁⠀⠀
⠀⠀⠀⠀⠀⠀⠁⠁⠀⠀⠀⠀⠀
¤═―— ⎧ 𝐋𝐄𝐊𝐙𝐎 𝐁𝐀𝐈𝐋𝐄𝐘𝐒 ⎭ ⊱―—═¤
Information:
Developer: @LekzoMarketV22
Version: 11.6
Status: Baileys Berhasil Terinstall
Update date: 17/06/26
`));
console.log(chalk.bold.gray("--------------------------------------------\n"));
console.log(chalk.bold.cyan("Follow Our Telegram Channel To See Update Information: t.me/LekzoMarketV2\n"));

export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export * from './Store/index.js';
export { makeWASocket };
export default makeWASocket;