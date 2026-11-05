// blog logs.
// valid categories (must match the HTML filter buttons exactly): 
// "ゲーム" (Gaming), "日常" (Life), "ガジェット" (Tech), "音楽" (Music), "ネット" (Internet)
// template:
// {
//     id: 2, // increment this
//     title: "system update",
//     date: "2026-08-23",
//     tag: "ガジェット", 
//     content: "array testing",
//     imgAlt: "describe any images used inside content here if you want"
// }
database.blog = [
    {
        id: 2,
        title: "3 months of my life, on this.",
        date: "2026-11-03",
        tags: [
            "ネット",
            "EN"
        ],
        content: "I'm so tired, I've neglected so much of my time lately by feeling the impulsive need to keep upgrading this lil site, like to an extreme degree it took up most of my days for the last few months. \n<br><br>\nHell I even put off the reason as to why I even made it, which is making music. But nooooow it's almost finally done so I can just start to create FINALLY. Fuck I don't want to do this ever again, ples can shit stop breaking. ◑﹏◐\n<br>\n<br>\nI have a few more things I want to add, but those will be done at a slower pace, what matters is the core of this bullshit is done. I hate this site lmao \n<br> \nwell I don't hate it.. I just want my time back pls refund life lemme get better grades and life choices instead (人´∀`)\n\n",
        tag: "日常"
    },
    {
        id: 1,
        title: "やったよ",
        date: "2026-08-23",
        content: "やっとこのサイトを作った。でも、大嫌いだｗｗｗ もっと良くできるよ、大丈夫、、、多分 笑 <br> <img src='https://static2.klipy.com/ii/4493325008d34b7bf8cd6813cd5c1619/62/5a/nHaTf0DZKbeW.gif' alt='アニメ少女が落ち込んで空虚な気持ち'>",
        tag: "ネット"
    }
];

(function () {
    const seen = new Set();
    let next = database.blog.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
    database.blog.forEach(p => {
        if (!p.id || seen.has(p.id)) p.id = next++;
        seen.add(p.id);
        if (!p.tag) p.tag = "日常";
        if (!p.title) p.title = "無題";
    });
})();
