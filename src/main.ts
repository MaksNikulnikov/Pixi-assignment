import { AppGame } from "@core/AppGame"

// Mount PIXI application inside #app
const host = document.getElementById('app') as HTMLDivElement
const game = new AppGame({ host })


// Expose for quick debugging
Object.assign(window as any, { game })