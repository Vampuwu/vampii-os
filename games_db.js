
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
    sight: '虫の知らせ | SECOND SIGHT',
    saved: '虫の知らせ // そのカメラには目隠しを貼った | second sight // you taped that one over just in time',
    scanned: '探知機が安全なマスを見つけた | the scanner opened somewhere safe',
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
    recording: '録音中... | recording...',
    making: '動画を作ってる... | making the video...',
    saved: '保存した | saved',
    keep: 'しまう | keep',
    kept: 'しまっといた | in files/',
    paper: '紙 | paper',
    badFile: 'それ読めない | cant read that one',
    tooLong: '長すぎ (5分まで) | too long (5 min max)',
    empty: 'まだ何も描いてない | nothing drawn yet',
    hint: 'ドラッグで描く。←→でコマ移動、スペースで再生 | drag to draw. ←→ for frames, space plays it'
};
window.gamesDB.flip = { lines: flipLines };
const torchLines = {
    tap: 'タップでつける | tap for light',
    off: 'タップで消す | tap to switch off'
};
window.gamesDB.torch = { lines: torchLines };
const fuseLines = {
    title: '臨界融合 | CRITICAL FUSE',
    sub: '同じのがくっつくと、ひとつ上のやつに変わる。赤い線を越えたらアウト | two the same touch, they turn into the next one up. dont stack past the red line',
    start: 'スタート | START',
    modes: 'モード | MODES',
    next: '次 | NEXT',
    score: 'スコア | SCORE',
    best: 'ベスト | BEST',
    chain: '連鎖 | CHAIN',
    ladder: '進化 | THE LADDER',
    close: 'ギリギリ +{n} | CLOSE CALL +{n}',
    over: 'メルトダウン | MELTDOWN',
    critical: '臨界 | CRITICAL',
    newBest: '新記録 | NEW BEST',
    retry: 'もう一回 | RETRY',
    holo: 'ホロバースト +{n} | HOLO BURST +{n}',
    holoTotal: 'ホロハート {n}個 | {n} holo hearts',
    holoRun: 'ホロハート | holo hearts',
    burstN: '{n}回バースト | {n} burst',
    bestCharm: '最高到達 | best charm',
    bigChain: '最大連鎖 | biggest chain',
    empty: 'まだ記録なし | nothing yet. drop something',
    shake: 'ゆらす | SHAKE',
    bombIn: '爆弾まで | BOMB IN',
    swap: '入れ替え | SWAP',
    rank: 'ランク | RANK',
    rankUp: 'ランクアップ | RANK UP',
    maxed: '最高ランク | maxed',
    shinyRun: 'キラ | shiny',
    shinyTotal: 'キラ {n}個 | {n} shiny',
    off: 'ベストまであと {n} | {n} off your best',
    fusedN: '融合 {n}回 | {n} fused',
    defused: '消火 +{n} | DEFUSED +{n}',
    pop: 'パンッ | POP',
    paused: '一時停止 | PAUSED',
    resume: '再開 | RESUME',
    end: 'やめる | END RUN',
    mute: 'ミュート | mute',
    unmute: 'ミュート解除 | sound on',
    hint: 'マウスで狙って、クリックで落とす。右クリックで入れ替え。←→とスペースでもいける、↑でゆらす、Cで入れ替え、Pで一時停止 | mouse aims, click drops, right click swaps. or ←→ and space, ↑ shakes, C swaps, P pauses',
    hintTouch: 'ドラッグで狙って、指を離すと落とす。「次」をタップで入れ替え、ゆらすボタンで揺らせる、Ⅱで一時停止 | drag to aim and let go to drop. tap NEXT to swap, ゆらす shakes it, Ⅱ pauses'
};
const fuseModes = {
    classic: '標準 | CLASSIC | the normal one. fuse them up, keep it under the red line',
    bomb: '爆弾 | BOMB | every so often you get a bomb. drop it in the pile, it blows the little ones away + flings the rest',
    lit: '導火線 | LIT | some come with a lit fuse. fuse it with its match before it burns down or it pops + shoves everything',
    magnet: '磁力 | MAGNET | matching ones pull toward each other when theyre close. chains go off on their own'
};
const fuseCharms = [
    'ドット抜け | dead pixel',
    'ボタン | button',
    'さくらんぼ | cherry',
    'サイコロ | dice',
    '宝石 | gem',
    'ハート | heart',
    '猫の鈴 | cat bell',
    'ミラーボール | disco ball',
    '月 | moon',
    '惑星 | planet',
    'ホロハート | holo heart'
];
const fuseRanks = [
    '低温 | COLD',
    '予熱 | WARMING UP',
    '通電 | POWERED ON',
    '稼働中 | RUNNING',
    '高温 | RUNNING HOT',
    '過熱 | OVERHEATING',
    '警報発令 | ALARMS GOING',
    '臨界寸前 | NEARLY CRITICAL',
    '臨界 | CRITICAL',
    '超臨界 | SUPERCRITICAL',
    'ホロ炉心 | HOLO CORE'
];
window.gamesDB.fuse = { lines: fuseLines, modes: fuseModes, charms: fuseCharms, ranks: fuseRanks };
const solLines = {
    title: 'ソリティア | SOLITAIRE',
    kind: 'クロンダイク | KLONDIKE',
    sub: '色を交互に、Kから下へ並べる。マークごとにAからKまで積んだら勝ち | build down the columns in alternating colours, get every suit home from A up to K',
    start: '配る | DEAL',
    time: '時間 | TIME',
    moves: '手数 | MOVES',
    score: 'スコア | SCORE',
    wins: '勝ち {n} | {n} won',
    best: 'ベスト {n} | best {n}',
    streak: '{n}連勝 | {n} in a row',
    bestStreak: '最高 {n}連勝 | best streak {n}',
    undo: '戻す | UNDO',
    hintB: 'ヒント | HINT',
    newDeal: '配り直す | NEW DEAL',
    stuck: '手詰まり | no moves left',
    auto: '自動で片付け中 | finishing it off',
    won: 'クリア | CLEARED',
    newBest: '新記録 | NEW BEST',
    bonus: 'タイムボーナス | time bonus',
    again: 'もう一回 | DEAL AGAIN',
    modes: 'モード | MODES',
    paused: '一時停止 | PAUSED',
    resume: '再開 | RESUME',
    end: 'やめる | QUIT',
    hint: 'ドラッグで動かす。クリックすると置ける所へ飛ぶ。スペースで山札をめくる、Zで戻す、Hでヒント、Nで配り直し、Pで一時停止 | drag cards, or click one and it goes where it fits. space draws, Z undo, H hint, N new deal, P pause',
    hintTouch: 'ドラッグで動かす。タップすると置ける所へ飛ぶ。山札はタップでめくる | drag cards, or tap one and it goes where it fits. tap the deck to draw'
};
const solModes = {
    one: '1枚 | DRAW 1 | one card at a time. the chill one',
    three: '3枚 | DRAW 3 | three at a time, only the top one plays. proper'
};
window.gamesDB.solitaire = { lines: solLines, modes: solModes };
// hardcore stack. the menu + the screen bits
const stackLines = {
    title: '鬼積み | HARDCORE STACK',
    edition: 'ハードコア積み版 | hardcore stacking edition',
    badge: 'ハードコア認定 | certified hardcore',
    sub: '板を落として積む。はみ出たら落ちる。崩したら終わり。ハードコアに積め | drop it on the tower. whatever hangs off falls off. tip it over and its done. stack hardcore',
    meter: '積みのハードコア度 | stacking hardness',
    xtreme: 'ハードコア | HARDCORE',
    insane: '超ハードコア | ULTRA HARDCORE',
    xtremeSub: '普通に積むだけでもう十分ハードコア | regular stacking. already hardcore enough',
    insaneSub: '最初から速い。変な形だらけ。板は戻らない。ハードコア | fast from the start. weird slabs. nothing grows back. hardcore',
    go: 'ハードコアに積む | START HARDCORE STACKING',
    warn: '※この積みはハードコアです | warning: this stacking is hardcore',
    home: 'ハードコアに積めない人は帰って | cant stack hardcore? go home',
    keys: 'スペースかクリックかタップで落とす。長押しでスロー。Pで一時停止、Rでやり直し、Mでミュート | space, click or tap drops it. hold for slow-mo. P pause, R restart, M mute',
    paused: '一時停止中 | paused',
    pausedSub: 'ハードコアも休憩は要る | even hardcore needs a minute',
    resume: '続ける | resume',
    achCount: '実績 {n}/{m} | achievements {n}/{m}',
    keysTouch: 'タップで落とす。長押しでスロー | tap drops it, hold for slow-mo',
    best: 'ベスト | best',
    again: 'もう一回 | again',
    menu: 'メニュー | menu',
    floors: '階 | floors',
    score: 'スコア | score',
    chain: '最大連続 | best chain',
    newBest: '新記録 | new best',
    song: '曲 | song',
    empty: 'まだ記録なし | nothing yet',
    wHead: '光過敏性発作についての警告 | WARNING: PHOTOSENSITIVE SEIZURES',
    w1: 'このゲームには点滅する光、ストロボ、激しい色の変化、速く動く模様がたくさん含まれています。 | This game has lots of flashing lights, strobes, rapid colour changes and fast-moving patterns.',
    w2: 'ごくまれに、点滅する光や模様を見ることで発作を起こす人がいます。これまで発作やてんかんになったことがない人でも起こることがあります。 | A very small number of people can have a seizure when they see certain flashing lights or patterns, even if they have never had a seizure or epilepsy before.',
    w3: '本人や家族にてんかんや発作の経験がある場合は、遊ぶ前に医師に相談してください。 | If you or anyone in your family has epilepsy or has had seizures, talk to a doctor before playing.',
    w4: 'めまい、見え方の異常、目や顔のけいれん、手足のふるえ、方向感覚がなくなる、混乱する、意識が一瞬遠のくなどの症状が出たら、すぐに遊ぶのをやめて医師に相談してください。 | Stop playing straight away and see a doctor if you get dizziness, blurred or changed vision, eye or face twitching, jerking or shaking arms or legs, disorientation, confusion, or a moment where you lose awareness.',
    w5: '明るい部屋で、画面から離れて遊んでください。こまめに休憩して、疲れているときは遊ばないでください。 | Play in a well-lit room and sit back from the screen. Take regular breaks, and don\'t play when you\'re tired.',
    w6: '「動きを減らす」をオンにすると、ストロボや点滅の演出がほとんど止まります。 | Turning on REDUCE MOTION switches off most of the strobing and flashing.',
    wMotion: '動きを減らす | reduce motion',
    wGo: 'わかった | i understand',
    on: 'オン | on',
    off: 'オフ | off',
    verdict: 'ハードコアに積めてない | not stacked hardcore enough',
    verdictGood: 'まあまあハードコアな積み | fairly hardcore stacking',
    marquee: 'ハードコア積み | HARDCORE STACKING',
    live: '生中継 | LIVE',
    watching: '視聴者 | watching',
    integrity: '耐久 | integrity',
    wind: '風 | wind',
    bpm: 'テンポ | bpm',
    mood: '板の気分 | slab mood',
    crows: 'カラス | crows',
    track: '曲 | track',
    stoke: 'オーバードライブ | overdrive',
    lean: '傾き | lean',
    radar: '真上から | top view',
    fever: 'ハードコア積み | hardcore stacking',
    boot1: '起動中 | starting up',
    boot2: '板 検出 | slab found',
    boot3: '重力 正常 | gravity ok',
    boot4: '準備完了 | go',
    lost: '信号ロスト | signal lost',
    moodBad: 'パニック | panicking',
    moodMid: '緊張 | tense',
    moodOk: '落ち着いてる | calm',
    hudChain: '連続 | chain',
    hudFloors: '階 | FLOOR',
    hudScore: 'スコア | SCORE',
    hudWarn: '警告 | warning',
    incident: '無事故で積んだ板 | slabs without an incident',
    pbLine: '自己ベスト | PB'
};
// the big chrome yelling. english only. split options with " / "
const stackShouts = {
    perfect: 'ZERO OVERHANG / FLUSH. HARDCORE. / LOAD BEARING',
    beat: 'STACKED ON THE KICK',
    chain: '{n} SLABS DEEP / {n}X FLUSH / COUNCIL HAS BEEN NOTIFIED',
    clean: 'IT IS A FLOOR',
    close: 'SHAVED. BARELY.',
    cut: 'OVERHANG DETECTED / BITS FELL OFF',
    lean: 'TOWER LEANING',
    wipe: 'TOWER DESTROYED',
    fever: 'HARDCORE STACKING MODE',
    feverEnd: 'STACKING MODE DEPLETED. HYDRATE.',
    trialWin: 'INSPECTION PASSED',
    trialLose: 'FAILED INSPECTION',
    hot: 'HOT SLAB INCOMING',
    hotWin: 'HOT SLAB STACKED',
    sector: 'FLOOR {n}',
    pb: 'NEW PERSONAL BEST'
};
const stackNames = {
    L: 'L BEAM',
    T: 'T BEAM',
    plus: 'CROSS',
    U: 'U CHANNEL',
    ring: 'RING',
    S: 'S BLOCK. GOOD LUCK.',
    dumb: 'DUMBBELL',
    stairs: 'STAIRS',
    dots: 'LOOSE BRICKS',
    hook: 'HOOK',
    comb: 'COMB',
    big: 'BIG ONE',
    plank: 'PLANK'
};
const stackAch = {
    first: 'FIRST SLAB',
    three: 'THREE (3) SLABS',
    perfect: 'FIRST PERFECT',
    cut: 'LOST A BIT',
    ten: '10 FLOORS',
    twenty: '20 FLOORS',
    chain5: '5 PERFECT IN A ROW',
    slow: 'USED SLOW-MO',
    fever: 'HARDCORE STACKING MODE',
    thirty: '30 FLOORS',
    fifty: '50 FLOORS',
    hot: 'TOUCHED THE HOT ONE',
    trial: 'PASSED AN INSPECTION',
    corner: 'THE SKULL HIT THE CORNER'
};
const stackRanks = [
    'WORK EXPERIENCE KID',
    'LABOURER',
    'BRICKIE',
    'CHIPPY',
    'LEADING HAND',
    'FOREMAN',
    'SITE MANAGER',
    'HARDCORE DEITY (PROVISIONAL)'
];
const stackTrials = {
    perfect: 'ALL FLUSH',
    beat: 'ALL ON THE BEAT',
    noslow: 'NO SLOW-MO'
};
// my marker scribbles. " / " between options
const stackScrawl = {
    slab: 'drop it. go on / why is it that shape',
    note: 'TODO make it harder / its 3am',
    wipe: 'lmaooo / skill issue',
    rank: 'not a real job',
    hard: 'this number means nothing',
    news: 'none of this is news',
    pa: 'mum look',
    chain: 'ok show off'
};
const stackNews = [
    '板が一枚積まれる|one slab placed',
    '専門家「高すぎる」|experts: its too high',
    'カラスが避難|crows evacuated',
    '傾きに注意|watch the lean'
];
const stackAds = [
    '腰痛に効く|good for your back',
    'ぬるい水 新発売|lukewarm water. new',
    '落とし物 預かってます|we have your lost thing',
    '牛乳|milk'
];
window.gamesDB.stack = { lines: stackLines, shouts: stackShouts, names: stackNames, ach: stackAch, ranks: stackRanks, trials: stackTrials, scrawl: stackScrawl, news: stackNews, ads: stackAds };
