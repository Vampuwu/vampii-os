
const sweepBoards = {
    alley: '路地 | ALLEY | 9 × 9, ten cameras. a back alley behind the arcade',
    street: '通り | STREET | 16 × 16, forty cameras. a whole street of shutters and signs',
    district: '地区 | DISTRICT | 30 × 16, ninety-nine cameras. a district that is watched properly',
    mirror: '鏡の街 | MIRROR TOWN | 16 × 16, the edges touch: walk off the left and you come back on the right'
};
const sweepLines = {
    go: '出動 | GO',
    menu: 'メニュー | MENU',
    title: '掃除 // カメラ・スイープ | SWEEP // THE CAMERAS',
    sub: '街の監視カメラを全部見つけろ // 数字はそのマスを見てるカメラの数 | find every camera on the block // a number = how many cameras can see that block',
    boards: '区画 | WHERE',
    start: '[ 掃除を始める ] | [ START SWEEPING ]',
    flag: '目隠し | TAPE',
    dig: '歩く | WALK',
    left: '残り {n} | {n} left',
    time: '{n} 秒 | {n}s',
    seen: '見られた // カメラに映った | seen // you walked into a camera',
    clear: '掃除完了 // {n} 秒 | swept clean // {n}s',
    record: '新記録 | a new best',
    best: '最速 {n} 秒 | best {n}s',
    par: '規定 {n} 秒 | par {n}s',
    underPar: '規定タイム以内 ★ | under par ★',
    cams: 'カメラ {n} 台 | {n} cams',
    marks: '？印 | ? MARKS',
    scan: '探知機 | SCANNER',
    bucket: '照明弾 | FLARE',
    sight: '二度目の目 | SECOND SIGHT',
    saved: '二度目の目が効いた // そのカメラには目隠しを貼った | second sight // you taped that one over just in time',
    scanned: '探知機が安全な所を開けた | the scanner opened somewhere safe',
    bucketed: '照明弾が光った // まわりのカメラは真っ白 | the flare went off // every camera round there is blinded',
    looks: '街の見え方 | HOW IT LOOKS',
    rules: '最初の一歩は必ず安全 // 数字 = 隣の8マスにいるカメラの数 // 右クリック(長押し)で目隠し、?印をオンにするともう一回で ? // 数字をクリックすると、目隠しが足りていれば周りを開ける // 全部の安全なマスを歩いたら完了、規定タイム以内なら ★ | the first step is always safe // a number = cameras in the eight blocks round it // right click (or hold) to tape one, with ? marks on a second one gives you a ? // click a number with enough tape round it to open the rest // walk every safe block to clear it, under par and you get a star',
    secretFound: '鏡の街 // 端と端がつながってる | mirror town // the edges join up'
};


window.gamesDB = window.gamesDB || {};
window.gamesDB.sweep = { boards: sweepBoards, lines: sweepLines };
const flipLines = {
    pen: 'ペン | pen',
    eraser: '消しゴム | eraser',
    fill: '塗り | fill',
    onion: '前のコマ | onion skin',
    play: '再生 | play',
    stop: '停止 | stop',
    loop: 'ループ | loop',
    speed: '速さ {n} | speed {n}',
    frame: '{n} / {m}',
    add: '新しいコマ | new frame',
    copy: 'コマを複製 | copy frame',
    del: 'コマを消す | delete frame',
    undo: '戻す | undo',
    sound: '音 | sound',
    rec: '録音 | rec',
    reRec: '録り直す | re-record',
    recHint: '録音を押すと最初から再生されるから、それに合わせてしゃべって | hit rec, it plays from the start, talk or sing over it',
    recStop: '止める | stop',
    test: '試聴 | listen',
    saveVid: '動画で保存 | save video',
    saveFile: '.vflipで保存 | save .vflip',
    openFile: '開く | open',
    leaveWarn: 'もう一回で終わる。保存してないよ | press again to leave. it isnt saved',
    micNo: 'マイク使えない | cant use the mic',
    recording: '録音中… | recording…',
    making: '動画を作ってる… | making the video…',
    saved: '保存した | saved',
    keep: 'しまう | keep',
    kept: 'しまった | in files/',
    paper: '紙 | paper',
    badFile: 'それ読めない | cant read that one',
    tooLong: '長すぎ (5分まで) | too long (5 min max)',
    empty: 'まだ何も描いてない | nothing drawn yet',
    hint: 'ドラッグで描く · ←→ コマ · スペース 再生 | drag to draw · ←→ frames · space plays'
};
window.gamesDB.flip = { lines: flipLines };
const torchLines = {
    tap: 'タップでつける | tap for light',
    off: 'タップで消す | tap to switch off'
};
window.gamesDB.torch = { lines: torchLines };
