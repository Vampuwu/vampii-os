
const appsDB = {
    icons: {
        pal: {
            k: '#0b0710',
            w: '#f4f0f8',
            W: '#cbc4d6',
            V: '#9b93ab',
            g: '#a9a2b6',
            G: '#827a91',
            H: '#5e576c',
            d: '#3a3150',
            D: '#272138',
            E: '#1a1526',
            i: '#6c6480',
            I: '#4b4560',
            L: '#332e44',
            y: '#fff3cf',
            Y: '#e5d3a3',
            Z: '#bda873',
            r: '#ff3355',
            R: '#cf2a47',
            U: '#8f1a31',
            o: '#ffd04a',
            O: '#d9a326',
            J: '#9c7212',
            n: '#6dffa0',
            N: '#40c56a',
            M: '#1f7a44',
            b: '#5cc8ff',
            B: '#3486d6',
            A: '#1f5596',
            c: '#c98a52',
            C: '#9a6338',
            F: '#6b4226',
            e: '#120d18'
        },
        art: {
            '💻': '................................|................................|................................|................................|................................|................kk..kk..........|..............kkddkkddkk........|............kkddddddddddkk......|..........kkddddddddddddddkk....|........kkddddddddddddddddddk...|......kkddddddddddddddddddssEk..|....kkddddddddddddddddddssEEEk..|...kdddsddddddddddddddssEEEEEk..|..kDssdDssddddddddddssEEEEsEEk..|..kDDDsDDDssddddddssEEEEpDsEEk..|..kDDDDDDDDDssddssEEEEwppDsEEk..|..kDDDDDDDDDDDssEEEEpwwpPDsEEk..|..kDDDDDDDDDDDsEEEpppwwPPDsEEk..|..kDDDDDDDDDDDsEEpppwwwPpDsEEk..|..kDDDDDDDDDDDsEEpPwwwpppDsEEk..|..kDDDDDDDDDDDsEEPPwppppPDsEEk..|..kDDDDDDDDDDDsEEPppppPPPDsEEk..|..kDDDDDDDDDDDsEEpppPPPPddsEEk..|..kDDDDDDDDDDDsEEpPPPPddssEEEk..|..kDDDDDDDDDDDsEEPPPddssEEEEk...|...kDDDDDDDDDDsEEPddssEEEEkk....|....kkDDDDDDDDsEEdssEEEEkk......|......kkDDDDDDsEEsEEEEkk........|........kkDDDpsEpEEEkk..........|..........kkDppppEkk............|............kkppkk..............|..............kk................',
            '📝': '................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|...............kk...............|.............kkddkk.............|...........kkddddddkk...........|.........kkddddssddddkk.........|...kk..kkddddTTssssddddkk.......|..kiikkddddssTTTTssssddddkk.....|.kIssiiddTTssssTTTTssssddddkk...|.kIIIssiiTTTTssssTTTTssTTddddk..|.kDIIIIssiiTTTTssssTTTTTTddssEk.|.kDDDIIIIssiiTTTTssssTTddssEEEk.|..kDDDDIIIIssiiTTTTssddssEEEEk..|...kkDDDDIIIIssppTTddssEEEEkk...|.....kkDDDDIIIppppdssEEEEkk.....|.......kkDDDDIppppsEEEEkk.......|.........kkDDDDppEEEEkk.........|...........kkDDsEEEkk...........|.............kksEkk.............|...............kk...............',
            '🎛': '............kk..................|..........kksskk................|.........ksssssskk..............|........kssssssssskk............|........kssssssssssskk..........|........kssssssssssssskk........|........ksssssssssssssssk.......|........kIsssssssssssssssk......|........kIsLsssssssssssssk......|........kIsLLLsssssssssssk......|........kIsLLLLksssssssssk......|........kIsLLLLkkkssssssLk......|........kIsLLLLk..kIssLLLk......|......kkpIsLLLLk..kIsLLLLk......|.....kpppIsLLLLk..kIsLLLLk......|....kppppIsLLLLk..kIsLLLLk......|....kppppIsLLLpk..kIsLLLLk......|....kpppppsLpppk..kIsLLLLk......|....kppppppppppdkkpIsLLLLk......|...kddpppppppppspppIsLLLLk......|..kDssddppppppdppppIsLLLLk......|..kDDDssddppdddppppIsLLLpk......|...kDDDDssdddddpppppsLpppk......|....kkDDDDssdddppppppppppdkk....|......kkDDDDssddpppppppppdddk...|........kkDDDDssddppppppddssEk..|..........kkDDDDssddppddssEEEk..|............kkDDDDssddssEEEEk...|..............kkDDDDssEEEEkk....|................kkDDsEEEkk......|..................kksEkk........|....................kk..........',
            '📕': '................................|................................|................................|..................kk............|................kkddkk..........|..............kkddddyykk........|............kkddddyyyyddk.......|..........kkddddyyyyddssEk......|........kkddddyyyyddssEEEk......|.......kddddyyyyddssEEEEsk......|......kDssyyyyddssEEEEsssk......|......kDDYyyddssEEEEssssEk......|......kDDYYDssEEEEssssEEEk......|......kDDYYDsEEEssssEEEEEk......|......kDDYYssEssssEEEEEEEk......|......kDDYYsssssEEEEEEEEEk......|......kDDYYDssEEEEEEEEpEEk......|......kDDYYDsEEEEEEEpppEEk......|......kDDYYDsEEEEEppppEEEk......|......kDDYYDsEEEppppEEEEEk......|......kDDYYDsEEpppEEEEEEEk......|......kDDYYDsEEpEEEEEEEEsk......|......kDDYYDsEEEEEEEEEsssk......|......kDDYYDsEEEEEEEssssEk......|......kDDYYDsEEEEEssssEEEk......|......kDDYYDsEEEssssEEEEk.......|......kDDYYssEssssEEEEkk........|......kDDYYsssssEEEEkk..........|.......kDYYDssEEEEkk............|........kkYDsEEEkk..............|..........kksEkk................|............kk..................',
            '🗒': '................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|...............kk...............|.............kksskk.............|...........kksssssskk...........|.........kkssssTTsssskk.........|.......kkppssssTTTTsssskk.......|.....kksppppTssssTTTTsssskk.....|....ksssppppTTTssssTTTTssssk....|...kSssssppssTTTTssssTTssssTk...|...kSSSssssssssTTTTssssssTTTk...|...kDSSSSssssssssTTssssTTTTEk...|...kDDDSSSSsssSssTsssTTTTEEEk...|...kDDDDDSSSSsSSTTsTTTTEEEEEk...|...kDDDDDDDSSSTSTSTTTEEEEEEEk...|....kDDDDDDDDSTddSTEEEEEEEEk....|.....kkDDDDDDDDssEEEEEEEEkk.....|.......kkDDDDDDsEEEEEEEkk.......|.........kkDDDDsEEEEEkk.........|...........kkDDsEEEkk...........|.............kksEkk.............|...............kk...............',
            '🎨': '................................|...............kk...............|..............kddk..............|.............kDssEk.............|.............kDsEEk.............|.............kDsEEk.............|.............kDsEEk.............|.............kDsEEk.............|.............kDsEEk.............|.............kDsEEk.............|.............kDsEEk.............|...........kkissEsikk...........|.........kkiiissssiiikk.........|.......kkiiiipsssspiiiikk.......|......kiiiipppsssspppiiiik......|.....kIiippppppssppppppiiLk.....|.....kIiippppppppppppppiiLk.....|.....kIssiippppppppppppssLk.....|.....kIIIssiippppppiipppLLk.....|.....kIIIIIssppppiissLppLLk.....|.....kIIIIIIppppIssLLLppLLk.....|.....kIIIIIIppppIsLLLLppLLk.....|.....kIIIIIIppppIsLLLLppLLk.....|.....kIIIIIIppppIsLLLLppLLk.....|.....kIIIIIIIppLIsLLLLppLLk.....|.....kIIIIIIIsLLIsLLLLppLLk.....|.....kIIIIIIIsLLIsLLLLpLLLk.....|......kIIIIIIsLLIsLLLLLLLk......|.......kkIIIIsLLIsLLLLLkk.......|.........kkIIsLLIsLLLkk.........|...........kksLkksLkk...........|.............kk..kk.............',
            '📟': '................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|.............kk.................|...........kknnkk...............|.........kkMMnnnnkk.............|.......kkMMMMnnnnndkk...........|.....kknnMMnnnnnnndiikk.........|...kkdnnnMMnnnnnnddiiddkk.......|..kdddnnMMMMnnniiddiiddiikk.....|.kDssddnMMMMnddiiddiiddssLdkk...|.kDDDssddMMdDssiiddppssELLdddk..|..kDDDDssdddDDIsspppppEELddssEk.|...kkDDDDssddDIIppppppEddssEEEk.|.....kkDDDDssddIpppppddssEEEEk..|.......kkDDDDssddppddssEEEEkk...|.........kkDDDDssddssEEEEkk.....|...........kkDDDDssEEEEkk.......|.............kkDDsEEEkk.........|...............kksEkk...........|.................kk.............',
            '🎹': '................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|..................kk............|................kkQQkk..........|..............kkQQQQpdk.........|.............kQQQQpppdkkkk......|............kpQQppppkkkkEwkk....|........kk..kpppppdEkkEEEwwwkk..|.......ksskkddppkksEEEEEwwwwwwk.|....kkkssssdddkkkkEwEEwwwwwwwwWk|...kppkssssskkkkEEEwwwwwwwwwWWWk|..kppppdssdEkkEEEEwwwwwwwwWWWWEk|..kppppdkksEEEEEwwwwwwwwWWWWEEEk|.kddppkkkkEwEEwwwwwwwwWWWWEEEEk.|kDssdEkkEEEwwwwwwwwwWWWWEEEEkk..|kDDDsEEEEEwwwwwwwwWWWWEEEEkk....|kDDDDWEEwwwwwwwwWWWWEEEEkk......|kDDDDWWWwwwwwwWWWWEEEEkk........|.kDDDDWWWWwwWWWWEEEEkk..........|..kkDDDDWWWWWWEEEEkk............|....kkDDDDWWEEEEkk..............|......kkDDsEEEkk................|........kksEkk..................|..........kk....................',
            '🎮': '.........................kk.....|.......................kkddkk...|.....................kkddddddk..|...................kkddddddssEk.|.................kkddddddssEEEk.|...............kkddddddssEEEEEk.|.............kkddddddssEEEETEEk.|...........kkddddddssEEEETTTEEk.|.........kkddddbbssEEEETTTTTEEk.|.......kkddddddbbbEEETTTTTTTEEk.|.....kkddddddssEbbETTTTsTTTTEEk.|...kkddddddssEEEbTTTTTssTTTTEEk.|..kddddddssEEEETTTTTTTsTTTTTEEk.|.kDssddssEEEEwTTTTTTTTTTTTTTEEk.|.kDDDssEEEETwwTTTTTpTTTTTTTTEEk.|.kDDDsEEETTTwpTTTpppTTTTTpTTEEk.|.kDDDsEETTTTppTpppppTTTpppTTEEk.|.kDDDsEETTTTpppppTppTppppTTTEEk.|.kDDDsEETTTTpppTTTpppppTTTTEEEk.|.kDDDsEETTTTpTTTTTpppTTTTEEEEk..|.kDDDsEETTTTTTTTTTpTTTTEEEEkk...|.kDDDsEETTTTTTTTTTTTTEEEEkk.....|.kDDDsEETTTTTTTTTTTEEEEkk.......|.kDDDsEETTTTTTTTTEEEEkk.........|.kDDDsEETTTTTTTEEEEkk...........|.kDDDsEETTTTTEEEEkk.............|.kDDDsEETTTEEEEkk...............|.kDDDsEETEEEEkk.................|.kDDDsEEEEEkk...................|..kDDsEEEkk.....................|...kksEkk.......................|.....kk.........................',
            '🐍': '................................|................................|................................|................................|.................kk.............|...........kk...kppkk...........|.........kkppkkkPppppkk.........|........kpPppppkPPPppppk........|.......kPpPPPpppPPPwwppQk.......|.......kPPQPPPPpPPwwkkQQk.......|.......kPPQQkPPPPPwwkkQQk..r....|.......kPPQQkkkPPPPwwPQQrrr.....|........kPQppkkkkPPPPPQQk..r....|.........kPppppkkkkPPPQQk.......|.........kPPPppppkkkkPQk........|..........kPPPPppppkkkk.........|.........kkkkPPPPppppk..........|.......kkppkkkkPPPPppQk.........|.....kkdPppppkkkkPPPQQk.........|....kdddPPPppppkkkkPQppk........|...kDssddPPPPppppkkkPppQk.......|...kDDDssddPPPPppppkPPQQk.......|....kDDDDssddPPPPpppPPQQk.......|.....kkDDDDssddPPPPpPPQQk.......|.......kkDDDDssddPPPQPQddkk.....|.........kkDDDDssddPQddddddk....|...........kkDDDDssddddddssEk...|.............kkDDDDssddssEEEk...|...............kkDDDDssEEEEk....|.................kkDDsEEEkk.....|...................kksEkk.......|.....................kk.........',
            '📒': '................................|................................|................................|................................|................................|................................|.............kk.................|...........kkiikk...............|.........kkiiiiwwkk.............|.......kkiiiiwwwwwwkk...........|.....kkiiiiwwwwppwwwwkk.........|...kkiiiiwwwwppppppwwwwkk.......|..kiiiiwwwwppppwwppppwwwwkk.....|.kIsswwwwwwppppwwppppwwwwwwkk...|.kIIWwwwwwwwwppppppsswwwwwwwwk..|.kIIWWWwwwwwwwwppwwsswwwwwwwwVk.|.kIIYWWWWwwwwwwwwwwwwwwwwwwVVVk.|.kIIYYYWWWWwwwWwwwwwwVwwwVVVVyk.|.kIIWYYYYWWWWwWWWwwVVVwVVVVyyyk.|.kIIWWWYYYYWWWVWWWVVVWVVVyyyyVk.|.kIIYWWWWYYYYWVyyWVyyWVyyyyVVVk.|.kIIYYYWWWWYYYYyyyyyyyyyyVVVVyk.|.kIIDYYYYWWWWYYYYyyyyyyVVVVyyyk.|..kIDDDYYYYWWWWYYYyyyVVVVyyyyEk.|...kkDDDDYYYYWWWWYyVVVVyyyyEEEk.|.....kkDDDDYYYYWWWVVVyyyyEEEEk..|.......kkDDDDYYYYWVyyyyEEEEkk...|.........kkDDDDYYYyyyEEEEkk.....|...........kkDDDDYyEEEEkk.......|.............kkDDsEEEkk.........|...............kksEkk...........|.................kk.............',
            '🔦': '................................|................................|................................|................................|................................|................................|................................|................................|......kk........................|....kkiikk......................|...kiiiiiikk....................|..kIssiiiiiikk..................|..kIIIiiiiisppkk................|.kiiIIIIssipppppkk..............|kIssiiIIIIippppppikk..kk........|kIIIiiiiIIIIpppppiiikkddkk......|kIIIIIssiiIIIIppiiiiddddddkk....|kIIIIIIIiiiiIIIIiiddddddddddkk..|.kIIIIIIIIssiiIIddddddddddddssk.|..kkIIIIIIIIssiDssddddddddoosssk|....kkIIIIIIIIsDDDssddddooooossk|......kkIIIIIIIDDDDDssssooooosok|........kkIIIIIDDDDDDssssooowook|..........kkIIIDDDDDDssssowwwook|............kkIDDDDDDossowwwwook|..............kDDDDDDoooowwwwosk|..............kDDDDDDoooowwwossk|...............kDDDDDoooowooosk.|................kkDDDsoosoookk..|..................kkDssssokk....|....................kksskk......|......................kk........',
            '⏲': '................................|................................|................................|................................|......kk..kk....................|....kkddkkiik...................|...kdddddIiiLkkk................|..kDssdddIILLkiik...............|..kDDDssddILdIiiLk..............|..kDDDDDssdddIILLk..kk..........|..kDEEDDDDssddILddkkrrk.........|..kEEEEEDDDDssdddddrrrrk........|..kEEEEEEEDDDDssdddrrrrk........|..kpEEEEEEEEDDDDssddrrddkk......|..kpppEEEEEEEEDDDDssddddddk.....|..kEpppEEEEEEEEDDDDDssddssEk....|..kEEEpEEpEEEEEDDDDDDDssEEEk....|..ksEEEEEpppEEpDDDDDDDsEEEEk....|..ksssEEEEpppppDwwDDDDsEEEEk....|..kEssssEEEEppEwwwwwDDsEEEiik...|..kEEEssssEEEEEwwwwwwDsEEIiiLk..|...kEEEEssssEEswwwwwwDsEEIILLk..|....kkEEEEssssswwwwwwDsEEIILLk..|......kkEEEEssEDwwwwwDsEEIILLk..|........kkEEEEEDiiwwDDsEEIILLk..|..........kkEEDIiirrDDsEEIILLk..|............kkDIIrrrrDsEEEILk...|..............kkIrrrrDsEEEEk....|................kkrrDDsEEEEk....|..................kkDDsEEEk.....|....................kksEkk......|......................kk........',
            '🖨': '................................|................................|................................|................................|................................|................................|................................|................................|............kk..................|..........kkiikk................|........kkiiiiiikk..............|......kkiiiiiiiiiikk............|....kkiiiiiiiiiiiiiikk..........|...kiiiiiiiiiiiiiiiiyykk........|..kIssiiiiiiiiiiisyyyyZdkk......|..kIIIssiiiiiiiiiYyyZZZdddk.....|..kDIIIIssiiisrriYnnZZddssEk....|..kDDDIIIIssirrrnnnnndssEEEk....|..kDDDDDIIIIsrrnnnnnnsEEEEEk....|..kDDDDDDDIIIDrnnnnnEEEEwwEk....|..kDDDDDDDDDIDDDnnEEEEwwwwwwk...|..kDiiDDDDDDDDDDsEEEwwwwwwwwVk..|..kIiiiiDDDDDDDDsEEWwwwwwwVVVk..|..kIIIiiiiDDDDDDsEEWWWwwVVVVEk..|...kIIIIiiiiDDDDsEEDWWWVVVEEEk..|....kkIIIIiiiiDDsEEDDDWVEEEEk...|......kkIIIIiiLDsEEEDDsEEEkk....|........kkIIILLDsEEEEEsEkk......|..........kkILDDsEEEEEkk........|............kkDDsEEEkk..........|..............kksEkk............|................kk..............',
            '🦆': '................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|................................|...................kk...........|.........kk......kkookk.........|........kook...kkooooookk.......|.......kOooJkkkoOooooooJok......|.......kOOJJkoooOOOooJJJoJk.....|......kooOJoOooooOOOJJJJJJk.....|.....kOoooooOOOooooOJJJJJJk.....|.....kOoooooOOOkkooJJJJrrJk.....|....koOoooooOOkkkkJJJrrrrrrk....|...kOoOOOoooOOkkkkJJRrrrrrrUk...|...kOOOOOOOoOOOkkOJJRRRrrUUUk...|...kOOOOOOOOOOOOOOJJJRRRUUUk....|...kOOOOOOOOOOOOOOJJJooRUJk.....|....kOOOOOOOOOOOJOJooooJJJk.....|.....kkOOOOOOOOOJooooJJJJJk.....|.......kkOOOOOOOOooJJJJJJJk.....|.........kkOOOOOOOJJJJJJJk......|...........kkOOOOOJJJJJkk.......|.............kkOOOJJJkk.........|...............kkOJkk...........|.................kk.............',
            '💗': '................................|...........kk...................|.........kkppkk.................|.......kkppppppkk...............|.....kkppppppppppk..............|....kpsppppppppppQkkk...........|...kPpswPppppppQQQkppkk.........|...kswwPPPPppwQQQppppppkk.......|...kswPPPPPPssQppppppppppk......|...kwPPPPPPPspsppppppppppQk.....|...kPPPPPPPPspwPPppppppQQQk.....|...kPPPPPPPsswPPPPPppsQQQppk....|....kPPPPPsswPPPPPPPssQppppQk...|.....kPPPsswPPPPPPPPsppppQQQk...|.....kPPsswPPPPPPPPssppsQQQQk...|......ksswPPPPPPPPsswPssQQQQk...|.......kwPPPPPPPPsswPPssQQQQk...|.......kPPPPPPPPsswPPPssQQQQk...|........kPPPPPPsswPPPPssQQQk....|.........kPPPPsswPPPPPssQkk.....|.........kPPPsswPPPPsPskk.......|..........kPsswPPPsPskk.........|.........kkdswPPsPsddkk.........|........kdddwPsPsddddddk........|.......kDddddPsddddddddEk.......|.......kDddddddddddddddEk.......|.......kDssddddddddddssEk.......|.......kDDDssddssddssEEEk.......|........kDDDDssEDssEEEEk........|.........kkDDsEEDsEEEkk.........|...........kksEkksEkk...........|.............kk..kk.............',
            '🃏': '................................|................................|................................|................................|...kk..........kk...............|..kiikk.......kddkk.............|.kIssiikk....kDssddkk...........|.kIIIssiikk..kDDDssddkk.........|.kIIIIIssiikkkDDDDDssddkk.......|.kIssIIIIssiikDDDDDDDssddkk.....|.kssssIIIIIssiiDDDDDDDDssddkk...|.kssssIIIIIIIssiiDDDDDDDDssddk..|.kpssppIIIIIIIIssLDDDDDDDDDssEk.|.kppppppIIIIIIIsLLDDDDDDDDDsEEk.|.kppppppIppIIIIsLLDDDDDDDDssEsk.|.kpppppppppppIIsLLDDDDDDDDssssk.|.kppppppppppppIsLLDDDDDDDDDssEk.|.kppppppppppppIsLLDDDDDDDDDsEEk.|.kIpppppppppppIsLLDDDDDDDDssEsk.|.kIIppppppppppIsLLDDDDDDDDssssk.|.kIIppppppppppIsLLDDDDDDDDDssEk.|.kIIIpppppppppIsLLDDDDDDDDDsEEk.|.kIIIIpppppppIIsLLDDDDDDDDssEsk.|.kIIIIpppppIIIIsLLDDDDDDDDssssk.|..kIIIIppIIIIIIsLLDDDDDDDDDssEk.|...kkIIIIIIssIIsLLDDDDDDDDDsEEk.|.....kkIIIssssIsLLkDDDDDDDssEsk.|.......kkIssssIsLLkkkDDDDDssssk.|.........kkssIIsLLk..kkDDDDssEk.|...........kkIIsLLk....kkDDsEEk.|.............kksLk.......kksEk..|...............kk..........kk...',
            '🛹': '................................|................................|................................|..............k.................|............kkrkk...............|..........kkrrrrrkk.............|........kkoRrrrrrUokk...........|......kkoooRRRrUUUoookk.........|....kkoooookRRUUUkoooookk.......|...kooooooookkUkkooooooook......|...kOOooooooookooooooooJJk......|...kOOOOoooooooooooookJJJk......|...kOOkkOOoooooooooJJJkkJk......|....kkOOOOOOoooookJJJJJJk.......|....kkOOOOkkOOoJJJkkJJJkkkk.....|......kkkkOOOOJJJJJJkkkssssk....|.....kSSkkOOOOkkJJJkkssssTTk....|.....kSSSSkkkkJJkkkssssTTTTk....|.....kSSSSSSkkJkkssssTTTTTTk....|.....kSSSSSSSSkssssTTTTTTTTk....|....kpkkSSSSSSSSsTTTTTTTTkk.....|...kPpppkkSSSSSSTTTTTTTkkpQk....|...kPPPpppkkSSSSTTTTTkkpQQQk....|...kPPPPPpppkkSSTTTkkpQQQQQk....|...kPPPPPPPpppkkTkkpQQQQQQQk....|....kPPPPPPPPpppkpQQQQQQQQk.....|.....kkPPPPPPPPpQQQQQQQQkk......|.......kkPPPPPPQQQQQQQkk........|.........kkPPPPQQQQQkk..........|...........kkPPQQQkk............|.............kkQkk..............|...............k................',
            '📺': '...................kk...........|.................kkddk..........|...............kkddssEk.........|.........kk..kkddssEEEk.........|........kiikkddssEEEEEk.........|.......kIiiddssEEEETEEk.........|.......kIddssEEEETTTEEk.........|......kddssEEEETTTTTEEk.........|.....kDssEEEEwTTTTTTEEk.........|.....kDsEEEwwwTTTTTpEEk.........|.....kDsEEwwwTTTTTppEEk.........|.....kDsEEwwTTTTTTpPEEk.........|.....kDsEEwwTTTTTpPPEEk.........|.....kDsEEwpTTTTppPPEEk.........|.....kDsEEppTTTTpPPPEEk.........|.....kDsEEpPTTTpPPPEEEk.........|.....kDsEEPPTpppPEEEEiikk.......|.....kDsEEPPpppEEEEiiiiiik......|.....kDsEEPPpEEEEiiiiiiiiLk.....|.....kDsEEPEEEEiiiiiiiiLLLk.....|.....kDsEEEEEiiiiiiiiLLLLk......|.....kDsEEEiiiiiiiiLLLLkk.......|.....kIsEiiiiiiiiLLLLLk.........|.....kIIIiiiiiiLLLLILLk.........|......kIIIIiiLLLLkIILLk.........|.......kkIIILLLkkkIILLk.........|.........kIILLk...kILk..........|.........kIILLk....kk...........|.........kIILLk.................|.........kIILLk.................|..........kILk..................|...........kk...................',
            '🗂': '................................|................................|..................kk............|................kkppkk..........|..............kkppppQpk.........|.............kppppwwQpQk........|............kPppwwwwVwQk........|............kPwwwwVVVwVk........|..........kkwwwwVVVVVVVk........|........kkwwwwVVVVVVVVVkkk......|......kkpWwwVVVVVVVVTVVkppk.....|....kkpppWWVVVVVVVTTTVppppQk....|...kppppwwWVVVVVTTTTppppQQQk....|..kPppQWwwVVVVTTTTppppQQQQQk....|..kPPQQWWVVVVTTTppppQQQQsQQk....|..kPPQQWWVVVVTppppQQQQsssQQk....|..kPPQQWWVVVppppQQQQssssQQQk....|..kPPQQWWVppppQQQQQsssQQQQQk....|..kPPQQWppppQQQQQQQsQQQQQQQk....|..kPPQQPppQQQQQQQQQQQQQQQQddk...|..kPPQQPPQQQQQQQQQQQQQQQddssEk..|..kPPQQPPQQQQQQQQQQQQQddssEEEk..|..kPPQQPPQQQQQQQQQQQddssEEEEk...|..kPPQQPPQQQQQQQQQddssEEEEkk....|..kPPQQPPQQQQQQQddssEEEEkk......|..kPPQQPPQQQQQddssEEEEkk........|..kPPQQPPQQQddssEEEEkk..........|...kPQkPPQddssEEEEkk............|....kkkPPDssEEEEkk..............|.......kPDsEEEkk................|........kksEkk..................|..........kk....................',
            '🖼': '................................|................................|................................|................................|................................|....kkkkkkkkkkkkkkkkkkkkkkkk....|...kyyyyyyyyyyyyyyyyyyyyyyyyk...|...kYccccccccccccccccccccccCDk..|...kYcAAAAAAAAAAAAAAAAAAAAcCDk..|...kYcAAAAAAAAAAAAAAAAAAAAcCDk..|...kYcAAAAAAAAAAAAAyyyAAAAcCDk..|...kYcAAAAAAAAAAAAywyyyAAAcCDk..|...kYcAAAAAAAAAAAAyyyyyAAAcCDk..|...kYcAAAAAAAAAAAAyyyyyAAAcCDk..|...kYcBBBBBBBBBBBBByyyBBBBcCDk..|...kYcBBBBBBBBBBBBBBBBBBBBcCDk..|...kYcBBBBBBBNNNNBBBBBBBBBcCDk..|...kYcBBBBBBNNNNNNNBBBBBBBcCDk..|...kYcBBBBNNNNNNNNNNBBBBBBcCDk..|...kYcbMMMMNNNNNNNNNNMMMbbcCDk..|...kYcMMMMMMNNNNNNNMMMMMMMcCDk..|...kYcMMMMMMMMNNNMMMMMMMMMcCDk..|...kYcMMMMMMMMMMMMMMMMMMMMcCDk..|...kYcMMMMMMMMMMMMMMMMMMMMcCDk..|...kYccccccccccccccccccccccCDk..|...kFFFFFFFFFFFFFFFFFFFFFFFFDk..|....kDDDDDDDDDDDDDDDDDDDDDDDDk..|.....kkkkkkkkkkkkkkkkkkkkkkkk...|................................|................................|................................|................................',
            '🔊': '................................|................................|................................|..................k.............|.................kHk............|.................kHk.......k....|................kWHk......kTk...|...............kWGHk...kk.kTTk..|..............kWGGHk..kSSk.kTk..|.............kWGGGHk...kSk.kTTk.|............kWGGGGHkkk.kSSkkTTk.|.....kkkkkkkWGGGGGHkssk.kSk.kTk.|....kggggggWgGGGGGHkksk.kSSkkTTk|....kGGGGGHggGGGGGHkksskkSSkkTTk|....kGGGGGHggGGGGGHk.ksk.kSkkTTk|....kGGGGGHggGGGGGHk.ksk.kSkkTTk|....kGGGGGHggGGGGGHk.ksk.kSkkTTk|....kGGGGGHggGGGGGHk.ksk.kSkkTTk|....kGGGGGHggGGGGGHkksskkSSkkTTk|....kGGGGGHggGGGGGHkksk.kSSkkTTk|....kGGGGGHHgGGGGGHkssk.kSk.kTk.|.....kkkkkkkHGGGGGHkkk.kSSkkTTk.|............kHGGGGHk...kSk.kTTk.|.............kHGGGHk..kSSk.kTk..|..............kHGGHk...kk.kTTk..|...............kHGHk......kTk...|................kHHk.......k....|.................kHk............|.................kHk............|..................k.............|................................|................................',
            '🗑': '................................|................................|................................|................................|.............kkkkkk.............|............kggggggk............|......kkkkkkkGGGGGGkkkkkkk......|.....kWWWWWWWWWWWWWWWWWWWWk.....|.....kggggggggggggggggggggDk....|.....kGGGGGGGGGGGGGGGGGGGGDk....|......kkggGGGGGGGGGGGGHHkkDk....|.......kggGGGGGGGGGGGGHHDkk.....|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGHgGHgGHgGGHHDk......|.......kggGGGGGGGGGGGGHHDk......|.......kggGGGGGGGGGGGGHHDk......|........kDDDDDDDDDDDDDDDDk......|.........kkkkkkkkkkkkkkkk.......|................................|................................',
            '🕒': '................................|................................|................................|.............kkkkkk.............|..........kkkppppppkkk..........|.........kppppppppppppk.........|........kppppwwwwwwppppk........|.......kpppwwwwwwwwwwpppk.......|......kppwwwwwwVwwwwwwwppk......|.....kppwwwVwwwkwwwwVwwwppk.....|....kpppwwwwwwwkwwwwwwwwpppk....|....kppwwwwwwwwkwwwwwwVwwpPk....|....kppwwVwwwwwkwwwwwwwwwPPk....|...kppwwwwwwwwwkwwwwwwwwwwPPk...|...kppwwwwwwwwwkwwwwwwwwwwPPk...|...kppwwwwwwwwwpkkkkwwwwwwPPk...|...kppwwVwwwwwwwswwwwwwwVWPPk...|...kppwwwwwwwwwwwwwwwwwwWWPPk...|...kppwwwwwwwwwwwwwwwwwWWWPPk...|....kppwwwwwwwwwwwwwwwWWWPPk....|....kppwwVwwwwwwwwwwwWVWWPPk....|....kpppwwwwwwwwwwwwWWWWPPPk....|.....kppwwwwVwwwwwwWVWWWPPk.....|......kppwwwwwwwwwWWWWWPPk......|.......kpppwwwwwVWWWWPPPk.......|........kpppPwwwWWWPPPPk........|.........kpPPPPPPPPPPPk.........|..........kkkPPPPPPkkk..........|.............kkkkkk.............|................................|................................|................................',
            '💾': '................................|................................|................................|................................|......kkkkkkkkkkkkkkkkkkkk......|.....kssssggggggggggggssssk.....|.....kspppgggggggHHHggpppPDk....|.....kspppgggggggHHHggpppPDk....|.....kspppgggggggHHHggpppPDk....|.....kspppgggggggHHHggpppPDk....|.....kspppgggggggHHHggpppPDk....|.....kspppggggggggggggpppPDk....|.....kspppGGGGGGGGGGGGpppPDk....|.....ksppppppppppppppppppPDk....|.....ksppppppppppppppppppPDk....|.....ksppppppppppppppppppPDk....|.....ksppWWWWWWWWWWWWWWppPDk....|.....ksppwwwwwwwwwwwwwwppPDk....|.....ksppwwwwwwwwwwwwwwppPDk....|.....ksppwwVVVVVVVVVVwwppPDk....|.....ksppwwwwwwwwwwwwwwppPDk....|.....ksppwwwwwwwwwwwwwwppPDk....|.....ksppwwVVVVVVVVVVwwppPDk....|.....ksppwwwwwwwwwwwwwwppPDk....|.....ksppwwwwwwwwwwwwwwppPDk....|.....ksppwwwwwwwwwwwwwwppPDk....|.....kQQQQQQQQQQQQQQQQQQQQDk....|......kDDDDDDDDDDDDDDDDDDDDk....|.......kkkkkkkkkkkkkkkkkkkk.....|................................|................................|................................',
            '📄': '................................|................................|................................|........kkkkkkkkkkkk............|.......kWwwwwwwwwwwWk...........|.......kWwwwwwwwwwwWWk..........|.......kWwwwwwwwwwwWWWk.........|.......kWwwwwwwwwwwWWWWk........|.......kWwwwwwwwwwwWWWWWk.......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwVVVVVVVVVVwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwVVVVVVVwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwVVVVVVVVVVwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwVVVVVVVwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwVVVVVVVVVVwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|.......kWwwwwwwwwwwwwwwwDk......|........kDDDDDDDDDDDDDDDDk......|.........kkkkkkkkkkkkkkkk.......|................................|................................',
            '🏆': '................................|................................|................................|................................|.......kkkkkkkkkkkkkkkkkk.......|......kYYYYYYYYYYYYYOOOOOk......|.......kyyyoooooooOOOOJJk.......|.....kkkyywoooooooOOOOJJkkk.....|....koooyywooooowoOOOOJJOOOk....|...kookkyyyoooowwwOOOOJJkkOOk...|...kok.kyyywoowwwwwOOOJJk.kOk...|...kok..kyyyooowswOOOJJk..kOk...|...kok..kyyyooowowOOOJJk..kOk...|...kookk.kyyyoooooOOOJk.kkOOk...|....koookkyyyoooooOOOJkkOOOk....|.....kkk..kyyoooooOOJk..kkk.....|..........kyyoooooOOJk..........|...........kyyoooOOJk...........|............kkkOOkkk............|..............kOOk..............|..............kOOk..............|...........kkkkOOkkkk...........|..........koooooooOOOk..........|........kkkoooooooOOOkkk........|.......kddddddddddddddddk.......|.......kddddddddddddddddk.......|.......kssssssssssssssssk.......|........kkkkkkkkkkkkkkkk........|................................|................................|................................|................................',
            '👁': '................................|................................|................................|................................|................................|................................|................................|.kk.............................|krrk............................|rrrrk...........................|rrrrk..........kk...............|IrrLk........kkddkk.............|IsLLk......kkddddddkk...........|IsLLk....kkddddTTddddkk.........|IsLLk..kkddddssTTssddddkk.......|IsLLkkkddddssssTTssssddddkk.....|IsLLkddddssssTTTTTTssssddddkk...|IsLLdddssssrrTTppTTQQssssddddkk.|IsLLdTTssTTrrppppppQQrrssTTddddk|DsLddTTssTTTTppppppTTrrssTTddssE|DDDssddssssTTTTppTTTTssssiissEEE|DDDDDssddssssTTTTTTssssddssLEEEE|DDDDDDDssddssssTTssssiissELLEEEE|kDDDDDDDDssddssTTssddssLEELEEEEk|.kkDDDDDDDDssddTTddssELLEEEEEkk.|...kkDDDDDDDDssddssEEELEEEEkk...|.....kkDDDDDDDDssEEEEEEEEkk.....|.......kkDDDDDDsEEEEEEEkk.......|.........kkDDDDsEEEEEkk.........|...........kkDDsEEEkk...........|.............kksEkk.............|...............kk...............',
            '⚙': '................................|................................|................................|................................|................................|................................|................................|................................|...............kk...............|.............kkppkk.............|............kppppppk............|.....kk....kPppppppQk....kk.....|...kkppkk..kPiippiiQk..kkppkk...|..kppppppkkssiissiisskkppppppk..|.kPppppppssssiissiissssppppppQk.|.kPPPppiissiissLIssiissiippQQQk.|.kPPPPIiissiiLLLIIIiissiiLQQQQk.|.kPPPPIiissiiLLLIIIiissiiLQQQQk.|.kPPPppiissiiiiLIiiiissiippQQQk.|.kPppppppssssiissiissssppppppQk.|.kPppppppQsssiissiisssPppppppQk.|.kPPPppQQQssIiippiiLssPPPppQQQk.|.kPPPPQQQQIsIppppppLsLPPPPQQQQk.|.kPPPPQQQQIIPppppppQLLPPPPQQQQk.|.kPPPPQQQQIIPPPppQQQLLPPPPQQQQk.|.kPPPPQQQQIIPPPPQQQQLLPPPPQQQQk.|..kPPPQQQkkIPPPPQQQQLkkPPPQQQk..|...kkPQkk..kPPPPQQQQk..kkPQkk...|.....kk....kPPPPQQQQk....kk.....|............kPPPQQQk............|.............kkPQkk.............|...............kk...............',
            '📁': '................................|................................|................................|................................|................................|..............kk................|.............kppkk..............|............kpppppkk............|............kpppppppk...........|............kDpppppppk..........|............kDDDpppppk..........|............kDDDDDppddkk........|............kDyyDDDDssddkk......|............kYyyyyDDDDssddkk....|............kYYYyyyyDDDDssddk...|............kYYYYYyyyyDDDDssEk..|............kYYYYYYYyyyyDDsEEk..|..........kkdYYYYYYYYYyyZDsEEk..|........kkdddYYYYYYYYYYZZDsEEk..|......kkddddddYYYYYYYYYZZDsEEk..|....kkddddddddddYYYYYYYZZDsEEk..|...kddddddddddddddYYYYYZZDsEEk..|..kDssddddddddddddddYYYZZDsEEk..|..kDDDssddddddddddddddYZddsEEk..|...kDDDDssddddddddddddddssEEEk..|....kkDDDDssddddddddddssEEEEk...|......kkDDDDssddddddssEEEEkk....|........kkDDDDssddssEEEEkk......|..........kkDDDDssEEEEkk........|............kkDDsEEEkk..........|..............kksEkk............|................kk..............',
            '♪': '................|....kkkkkkkkkkkk|....kwsssssssspk|....kpppppppppPk|....kpPkkkkkkpPk|....kpPk....kpPk|....kpPk....kpPk|....kpPk....kpPk|....kpPk....kpPk|.kkkkpPk.kkkkpPk|kwsppPPkkwsppPPk|ksppppPkksppppPk|kpppppQkkpppppQk|.kPPPQk..kPPPQk.|..kkkk....kkkk..|................',
            '日': '................|...k..k..k..k...|..kWkkWkkWkkWk..|.kpWppWppWppWpk.|.kwssssssssssPk.|.kspppppppppPPk.|.kspQQQQQQQpPPk.|.kspppppppppPPk.|.kspQQQQQQQpPkwk|.kspppppppppkOwk|.kspQQQQpppkoOWk|.kspppppppkoOkk.|.kPPPPPPPkoOkPk.|.kkkkkkkkoOkkkk.|.......kkYk.....|.......kk.......',
            '本': '................|..kkkkkkkkkkkk..|..kQwsssssssWk..|..kQsppppppPWk..|..kQsppppppPWk..|..kQspkkkkpPWk..|..kQspkwWkpPWk..|..kQspkkkkpPWk..|..kQsppppppPWk..|..kQsppppppPWk..|..kQsppppppPWk..|..kQPPPPPPPPWk..|..kQWWWWWWWWWk..|..kkkkkkSSkkkk..|........SS......|........S.S.....',
            'pt-pen': '.............k..|............kpk.|...........kpPQk|..........kwWQk.|.........kwWGk..|........kwWGk...|.......kwWGk....|......kwWGk.....|.....kwWGk......|....kwWGk.......|...kwWGk........|..kHWGk.........|.kHHDk..........|.kpDk...........|.pkk............|p...............',
            'pt-neon': '................|..............k.|.............kpk|............kpwp|...k.......kpwpk|..kpk.....kpwpk.|.kpwpk...kpwpk..|.kpwwpk.kpwpk...|..kpwwpkpwpk....|...kpwwpwpk.....|....kpwwpk......|.....kpwk.......|......kk........|....kkkkkk......|....kGGGGk......|....kkkkkk......',
            'pt-brush3d': '................|................|..........kkkk..|........kkwppk..|......kkwppppk..|....kkwppppkPk..|...kwppppkkPQk..|..kwpppkkPPQk...|..kpppkPPPQk....|..kppkPPQQk.....|..kpkPPQQk......|..kkPPQQk.......|...kPQQk........|...kQQk.........|...kkk..........|................',
            'pt-anaglyph': '................|................|................|.k............k.|.k............k.|.kkkkkkkkkkkkkk.|.kwwwwwkkwwwwwk.|.krrrrrkkbbbbbk.|.krwrrRkkbwbbBk.|.krrrRRkkbbbBBk.|.kRRRRRkkkBBBBk.|..kkkkk...kkkk..|................|................|................|................',
            'pt-glitch': '................|................|..kkkkkkkkkk....|..kpppppwppk....|..kkkkkkkkkkk...|....kssssssk....|..rkkkkkkkkkb...|.kkkkkkkkkk.....|.kppwpppppk.....|.kkkkkkkkkkkkk..|......kpppppwk..|...r..kkkkkkkk.b|..kkkkkkkkk.....|..kssssswsk.....|..kkkkkkkkk.....|................',
            'pt-spray': '.........P.p....|......kk..p.Q...|.....kHHk..P....|.....kkkk.p.p...|....kwWWGk......|...kwWWWGGk.....|...kwpppPGk.....|...kwpwpPGk.....|...kwpppPGk.....|...kwPPPQGk.....|...kwWWWGGk.....|...kwWWWGGk.....|...kwWWWGGk.....|...kWGGGGHk.....|....kkkkkk......|................',
            'pt-pixel': '................|.kkkkkkkkkkkkkk.|.kwwkWWkwwkWWkk.|.kwwkWWkppkWWkk.|.kkkkkkkkkkkkkk.|.kWWkppkppkppkk.|.kWWkppkppkppkk.|.kkkkkkkkkkkkkk.|.kwwkppkPPkWWkk.|.kwwkppkPPkWWkk.|.kkkkkkkkkkkkkk.|.kWWkWWkPPkwwkk.|.kWWkWWkPPkwwkk.|.kkkkkkkkkkkkkk.|................|................',
            'pt-eraser': '................|..........kkk...|.........kwwwk..|........kwwwWGk.|.......kpwwWGGk.|......kppkWGGk..|.....kpppPkGk...|....kpppPPQk....|...kwpppPQk.....|..kwWpPPQk......|..kWWWPQk.......|..kGWWQk........|...kGGk.........|....kk.....GHG..|..........GG....|................',
            'pt-mybrush': '................|............kk..|...........kcck.|..........kccCk.|.........kccCk..|........kccCk...|.......kccCk....|......kccCk.....|.....kccCk......|...kkccCk.......|..kswWCk........|.ksspGk.....s...|.kspPPk....sws..|kppPPk......s...|kpPkk...........|.kk.............',
            'pt-tone': '................|.kkkkkkkkkkkkk..|.kwwwwwwwwwwwkk.|.kwPPwPPwPwPwkk.|.kwPPwPPwPwPwkk.|.kwwwwwwwwwwwkk.|.kwPPwPPwPwwPkk.|.kwPPwPPwPwwwkk.|.kwwwwwwwwwwwkk.|.kwPPwPwwPwwwkk.|.kwPPwwwwwwwPkk.|.kwwwwwwwwwwwkk.|.kkkkkkkkkkkkkk.|..kkkkkkkkkkkkk.|................|................',
            'pt-air': '................|................|...............k|..............kH|.............kHd|............kwWD|..........kkwWGk|.........kwwWGk.|.........kwHDk..|.P......kwWDDk..|..Qp...kwWGkk...|Q....pkwWGk.....|..p.P.kHGk......|......Qkk.......|.Q.P.Q..........|................',
            'pt-smudge': '................|.........kkk....|........kyyyk...|........kywyYk..|........kyyyYk..|........kyyyYk..|......kkkyyyYk..|.....kyyyyyyYk..|.....kyyyyyyYk..|.....kyyyyyYYk..|......kyyyYYk...|.ppPkkkyyYkk....|pppPPQkkkkQ.....|.ppPPQQ.Q.......|..pPQ...........|................',
            'pt-blur': '.......kk.......|......kbbk......|......kbbk......|.....kbwbbk.....|.....kbwbbk.....|....kbwbbbBk....|...kbwbbbbbBk...|...kbwbbbbbBk...|..kbbbbbbbbBBk..|..kbbbbbbbbBBk..|..kbbbbbbbBBBk..|...kbbbbbBBBk...|...kBbbbBBBAk...|....kkBBBAkk....|......kkkk......|................',
            'pt-sort': '................|.kkkkkkkkkkkkkk.|.kwppsspwwpssPk.|.kppsspwwpssPPk.|.kppsspwwpssPPk.|.kPpsSpwWpsSPQk.|.kPpSSpWWpSSPQk.|.kPPSSPWWPSSQQk.|.kPPSSPWWPSSQQk.|.kQPSTPWGPSTQQk.|.kQPTTPGGPTTQQk.|.kQQTTQGGQTT.Qk.|.kQ.T.QG..T..Qk.|.kQ.T..G.....Qk.|.kkkkkkkkkkkkkk.|................',
            'pt-xform': '................|.kkk..k..k..kkk.|.kwk........kwk.|.kkk........kkk.|..........kk....|.k.....kkkppk...|.......kppppk.k.|.k.....kppkk....|......kpk.......|.k....kpk.....k.|......kpk.......|.k.....k......k.|.kkk........kkk.|.kwk........kwk.|.kkk..k..k..kkk.|................',
            'pt-line': '................|............kkk.|............kwk.|...........kkkk.|..........kpk...|.........kpk....|........kpk.....|.......kpk......|......kpk.......|.....kpk........|....kpk.........|...kpk..........|.kkkk...........|.kwk............|.kkk............|................',
            'pt-rect': '................|................|..kkkkkkkkkkkk..|..kppppppppppk..|..kpkkkkkkkkPk..|..kpk......kPk..|..kpk......kPk..|..kpk......kPk..|..kpk......kPk..|..kpk......kPk..|..kpk......kPk..|..kpkkkkkkkkPk..|..kPPPPPPPPPPk..|..kkkkkkkkkkkk..|................|................',
            'pt-ellipse': '................|................|.....kkkkkk.....|...kkppppppkk...|..kppkkkkkkppk..|.kpkk......kkPk.|.kpk........kPk.|.kpk........kPk.|.kpk........kPk.|.kpk........kPk.|.kPkk......kkPk.|..kPPkkkkkkPPk..|...kkPPPPPPkk...|.....kkkkkk.....|................|................',
            'pt-gradient': '................|.kkkkkkkkkkkkkk.|.kwwwpwpppPPQQk.|.kwwpwpppPpPQQk.|.kwwwpwpppPPQQk.|.kwwpwpppPpPQQk.|.kwwwpwpppPPQQk.|.kwwpwpppPpPQQk.|.kwwwpwpppPPQQk.|.kwwpwpppPpPQQk.|.kwwwpwpppPPQQk.|.kwwpwpppPpPQQk.|.kkkkkkkkkkkkkk.|..k..........k..|..k..........k..|................',
            'pt-fill': '................|.....kk.........|....kwwk........|...kwkkwk.......|..kwk..kwk......|.kWWkkkkWWk.....|kWWWWWWWWWWk....|kwWWWWWWWWGpk...|.kwWWWWWWGppk...|..kwWWWWGkppk...|...kwWWGk.ppk...|....kwGk..ppk...|.....kk...kpk...|..........kpk...|.........kpppk..|.........kkkkk..',
            'pt-select': '................|.kk.kk.kk.kk.k..|.k...........k..|................|.k...........k..|.k...........k..|................|.k...........k..|.k......k....k..|........kk......|.k......kwk..k..|.k......kwwk.k..|........kwwwk...|.kk.kk.kkwwkkk..|.........kwk....|..........k.....',
            'pt-lasso': '................|.....kkkkkk.....|...kkwwwwwwkk...|..kww......wwk..|.kw..........wk.|.kw..........wk.|..kw........wk..|...kkw....wkk...|.....kkkwkk.....|.......kwk......|......kpPk......|......kPpk......|.......kk.......|......kw........|.....kw.........|....k...........',
            'pt-wand': '..........p.....|.........pwp....|......p.pwwwp.p.|.......pwwwwwp..|........pwwwp...|.......kpwpwp...|......kwkp..p...|.....kwk........|....kWk.........|...kWk..........|..kGk...........|.kGk............|kGk.............|kk..............|................|................',
            'pt-b-new': '................|..kkkkkkkkk.....|..kwwwwwwwkk....|..kwwwwwwwkWk...|..kwwwwwwwkkkk..|..kwwwwwwwwwWk..|..kwwwwwwwwwWk..|..kwwwwwwwwwWk..|..kwwwwwwwwwWp..|..kwwwwwwwwkpppk|..kwwwwwwwwwWp..|..kwwwwwwwwwWk..|..kwwwwwwwwwWk..|..kWWWWWWWWWWk..|..kkkkkkkkkkkk..|................',
            'pt-b-open': '................|................|................|..kkkkk.........|.kOooooOk.......|kOooooooOkkkkkk.|kOoooooooooooook|kOkkkkkkkkkkkkkk|kOkyyyyyyyyyyyyk|kkyyyyyyyyyyyyk.|kkyyyyyyyyyyyyk.|kyyyyyyyyyyyyk..|kyyyyyyyyyyyyk..|kkkkkkkkkkkkkk..|................|................',
            'pt-b-save': '................|..kkkkkkkkkkkk..|.kkpWWWWWWWWpkk.|.kppWWWWWkkWppk.|.kppWWWWWkkWppk.|.kppWWWWWkkWppk.|.kppWWWWWWWWppk.|.kppppppppppppk.|.kppppppppppppk.|.kpwwwwwwwwwwpk.|.kpwWWWWWWWWwpk.|.kpwwwwwwwwwwpk.|.kpwWWWWWWWWwpk.|.kpwwwwwwwwwwpk.|.kkkkkkkkkkkkkk.|................',
            'pt-b-print': '................|....kkkkkkkk....|....kwwwwwwk....|....kwWWWWwk....|....kwwwwwwk....|.kkkkkkkkkkkkkk.|kiiiiiiiiiiiiiik|kiIIIIIIIIIInnik|kiIIIIIIIIIIIIik|kLLLkkkkkkkkLLLk|kLLkwwwwwwwwkLLk|kkkkwppppppwkkkk|...kwwwwwwwwk...|...kwpppppwwk...|...kwwwwwwwwk...|...kkkkkkkkkk...',
            'pt-b-fx': '.......k........|......kpk.......|.....kpwpk......|...kkpwwwpkk....|..kpwwwwwwwpk...|...kkpwwwpkk....|.....kpwpk...k..|......kpk...ksk.|.......k...kswsk|............ksk.|.....k.......k..|....ksk.........|...kswsk........|....ksk.........|.....k..........|................',
            'pt-b-undo': '................|....kk..........|...kpk..........|..kppkkkkkkk....|.kpppppppppkk...|kpppppppppppkk..|.kpppppppppppk..|..kppkkkkkkpppk.|...kpk.....kppk.|....kk......kpk.|............kpk.|...........kppk.|..........kppk..|..........kkk...|................|................',
            'pt-b-redo': '................|..........kk....|..........kpk...|....kkkkkkkppk..|...kkpppppppppk.|..kkpppppppppppk|..kpppppppppppk.|.kpppkkkkkkppk..|.kppk.....kpk...|.kpk......kk....|.kpk............|.kppk...........|..kppk..........|...kkk..........|................|................',
            'pt-b-grid': '................|.kkkkkkkkkkkkkk.|.kwwwGwwwwGwwwk.|.kwwwGwwwwGwwwk.|.kwwwGwwwwGwwwk.|.kGGGGGGGGGGGGk.|.kwwwGwwwwGwwwk.|.kwwwGwwwwGwwwk.|.kwwwGwwwwGwwwk.|.kwwwGwwwwGwwwk.|.kGGGGGGGGGGGGk.|.kwwwGwwwwGwwwk.|.kwwwGwwwwGwwwk.|.kwwwGwwwwGwwwk.|.kkkkkkkkkkkkkk.|................',
            'pt-b-centre': '................|.kkkk......kkkk.|.k............k.|.k............k.|.k.....kk.....k.|.......kk.......|.......kk.......|....kkkppkkk....|....kkkppkkk....|.......kk.......|.......kk.......|.k.....kk.....k.|.k............k.|.k............k.|.kkkk......kkkk.|................',
            'pt-b-flip': '.......GG.......|......k..k......|.....kk..kk.....|....kpk..kWk....|...kppk..kWWk...|..kpppk..kWWWk..|.kppppk..kWWWWk.|kpppppk..kWWWWWk|.kppppk..kWWWWk.|..kpppk..kWWWk..|...kppk..kWWk...|....kpk..kWk....|.....kk..kk.....|......k..k......|................|.......GG.......',
            'pt-b-crt': '.....k....k.....|......k..k......|kkkkkkkkkkkkkkkk|kHHHHHHHHHHHHHHk|kHkkkkkkkkkkHHHk|kHksssssssskHpHk|kHkddddddddkHHHk|kHksssssssskHHHk|kHkddddddddkHGHk|kHksssssssskHGHk|kHkddddddddkHHHk|kHkkkkkkkkkkHHHk|kHHHHHHHHHHHHHHk|kkkkkkkkkkkkkkkk|...kk......kk...|...kk......kk...',
            'pt-b-help': '................|.....kkkkkk.....|....kppppppk....|...kppkkkkppk...|...kpk....kpk...|...kkk...kppk...|.........kpk....|........kppk....|.......kppk.....|.......kpk......|.......kkk......|................|.......kkk......|.......kpk......|.......kkk......|................',
            'pt-b-time': '................|................|kkkkkkkkkkkkkkkk|kWHHWHHWHHWHHWHk|kwwwwwkwwwwwwwwk|kwwwwwkkwwwwwwwk|kwwwwwkpkwwwwwwk|kwwwwwkppkwwwwwk|kwwwwwkpkwwwwwwk|kwwwwwkkwwwwwwwk|kwwwwwkwwwwwwwwk|kwwwwwwwwwwwwwwk|kWHHWHHWHHWHHWHk|kkkkkkkkkkkkkkkk|................|................',
            'pt-b-ref': '................|................|kkkkkkkkkkkkkkkk|kGGGGGGGGGGGGGGk|kGbbbbbbbboobbGk|kGbbbbbbbboobbGk|kGbbbbbbbbbbbbGk|kGbbbbkbbbbbbbGk|kGbbbkWkbbbbbbGk|kGbbkWWNkbbkbbGk|kGbkNNNNNkkNkbGk|kGkNNNNNNNNNNkGk|kGGGGGGGGGGGGGGk|kkkkkkkkkkkkkkkk|................|................',
            'pt-b-purge': '................|.....kkkkkk.....|..kkkkkkkkkkkk..|..krrrrrrrrrrk..|...kkkkkkkkkk...|...krrrrrrrrk...|...kRRURURURk...|...kRRURURURk...|...kRRURURURk...|...kRRURURURk...|...kRRURURURk...|...kRRURURURk...|...kRRURURURk...|...kRRURURURk...|...kRRRRRRRRk...|...kkkkkkkkkk...',
            'pt-b-layers': '................|.....kkkkkkkkkk.|.....kGGGGGGGGk.|.....kGGGGGGGGk.|...kkkkkkkkkkGk.|...kWWWWWWWWkGk.|...kWWWWWWWWkGk.|.kkkkkkkkkkWkGk.|.kPPPPPPPPkWkkk.|.kppppppppkWk...|.kppppppppkWk...|.kppppppppkkk...|.kppppppppk.....|.kppppppppk.....|.kkkkkkkkkk.....|................',
            'pt-l-add': '................|................|..kkkkkkkkkkkk..|..kwwwwwwwwwwk..|..kwwwwwwwwwwk..|..kwwwwppwwwwk..|..kwwwwppwwwwk..|..kwwppppppwwk..|..kwwppppppwwk..|..kwwwwppwwwwk..|..kwwwwppwwwwk..|..kwwwwwwwwwwk..|..kwwwwwwwwwwk..|..kkkkkkkkkkkk..|................|................',
            'pt-l-dup': '................|.....kkkkkkkkkk.|.....kWWWWWWWWk.|.....kWWWWWWWWk.|.....kWWWWWWWWk.|.kkkkkkkkkkWWWk.|.kwwwwwwwwkWWWk.|.kwwwwwwwwkWWWk.|.kwwwwwwwwkWWWk.|.kwwwwwwwwkWWWk.|.kwwwwwwwwkkkkk.|.kwwwwwwwwk.....|.kwwwwwwwwk.....|.kwwwwwwwwk.....|.kkkkkkkkkk.....|................',
            'pt-l-up': '................|................|........kk......|.......kppk.....|......kppppk....|.....kppppppk...|....kppppppppk..|...kkkkppppkkkk.|......kppppk....|......kppppk....|......kppppk....|......kppppk....|......kkkkkk....|................|................|................',
            'pt-l-down': '................|................|......kkkkkk....|......kppppk....|......kppppk....|......kppppk....|......kppppk....|...kkkkppppkkkk.|....kppppppppk..|.....kppppppk...|......kppppk....|.......kppk.....|........kk......|................|................|................',
            'pt-l-merge': '................|......kkkk......|......kppk......|......kppk......|....kkkppkkk....|.....kppppk.....|......kppk......|.......kk.......|................|................|.kkkkkkkkkkkkkk.|.kwwwwwwwwwwwwk.|.kWWWWWWWWWWWWk.|.kWWWWWWWWWWWWk.|.kkkkkkkkkkkkkk.|................',
            'pt-l-fold': '................|................|................|kkkkk...........|kOooOkkkkkkkkk..|kOoooooooooooOk.|kkkkkkkkkkkkkkk.|koooooooooooooOk|koooooooooooooOk|koooooooooooooOk|koooooooooooooOk|kOOOOOOOOOOOOOOk|kkkkkkkkkkkkkkkk|................|................|................',
            'pt-l-del': '................|.....kkkkkk.....|..kkkkkkkkkkkk..|..kkkkkkkkkkkk..|...kkkkkkkkkk...|...kWWWWWWWWk...|...kWWGWGWGWk...|...kWWGWGWGWk...|...kWWGWGWGWk...|...kWWGWGWGWk...|...kWWGWGWGWk...|...kWWGWGWGWk...|...kWWGWGWGWk...|...kWWGWGWGWk...|...kWWWWWWWWk...|...kkkkkkkkkk...',
            'pt-l-eye': '................|................|................|................|....kkkkkkk.....|..kkwwwwwwwkk...|.kwwwwkkkwwwwk..|kwwwwkpppkwwwwk.|kwwwwkpkpkwwwwk.|kwwwwkpppkwwwwk.|.kwwwwkkkwwwwk..|..kkwwwwwwwkk...|....kkkkkkk.....|................|................|................',
            'pt-l-eyeoff': '................|................|................|................|................|................|................|kk...........kk.|.kk.........kk..|..kkkkkkkkkkk...|...k.k.k.k.k....|................|................|................|................|................',
            'pt-l-lock': '................|................|.....kkkkk......|....kGGGGGk.....|....kG...Gk.....|....kG...Gk.....|..kkkkkkkkkkk...|..koooooooooOk..|..kooookkooOOk..|..kooookkoOOOk..|..koooookoOOOk..|..kOOOOOOOOOOk..|..kkkkkkkkkkkk..|................|................|................',
            'pt-l-alock': '................|.kkkkkkkkkkkkkk.|.kWwwwWWWwwwWWk.|.kwWWWwwwWWWwwk.|.kwWWWwwwWWWwwk.|.kwWWkkkwWkWwwk.|.kWwkpWWkkwwWWk.|.kWwkpWWWkwwWWk.|.kWwkpWWWkwwWWk.|.kwWkpwwkkWWwwk.|.kwWWkkkwWkWwwk.|.kwWWWwwwWWWwwk.|.kWwwwWWWwwwWWk.|.kWwwwWWWwwwWWk.|.kkkkkkkkkkkkkk.|................',
            'pt-l-clip': '................|................|...kk...........|...kpk..........|...kpk..........|...kpk..........|...kpk..........|...kpk..........|...kpkkkkkkk....|...kpppppppk....|....kkkkkkpkk...|.........kpppk..|..........kpk...|...........k....|................|................',
            'pt-l-selclear': '................|................|................|.k.k.k.k.k.k.kk.|.kwwwwwwwwwwwwk.|.kwrwwwwwwwwrwk.|.kwwrrwwwwrrwwk.|.kwwwwrrrrwwwwk.|.kwwwwrrrrwwwwk.|.kwwrrwwwwrrwwk.|.kwrwwwwwwwwrwk.|.kwwwwwwwwwwwwk.|.kk.k.k.k.k.k.k.|................|................|................',
            'pt-l-seloff': '................|................|.k.k.k.k.k.k.kk.|.k..............|..............k.|.k..............|..............k.|.k..............|..............k.|.k..............|..............k.|.k..............|..............k.|.kk.k.k.k.k.k.k.|................|................',
            'pt-l-cut': '................|k.k.k.kk........|k...............|.......k........|k...............|.......k........|k.....kkkkkkkkkk|......kwwwwwwwwk|kk.k.kkwwwwwwwwk|......kwwwppwwwk|......kwwppppwwk|......kwwppppwwk|......kwwwppwwwk|......kwwwwwwwwk|......kwwwwwwwwk|......kkkkkkkkkk',
            'pt-pick': '............k...|...........kHk..|..........kHHdk.|.........kHHdDDk|.........kHdDDk.|........kWWDDk..|.......kwWGkk...|......kwpPk.....|.....kwpPk......|....kwpPk.......|...kwpPk........|..kwpPk.........|.kwpPk..........|..kPk...........|.p.k............|................'
        },
        img: {},
        themes: {}
    },
    sweep: { alleyPar: 60, streetPar: 200, districtPar: 600, mirrorPar: 300 },
    // sizes are in tube units (the tube is 360 wide). odds only cover the 5 that can drop
    fuse: {
        gravity: 2200,
        bounce: 0.12,
        friction: 0.12,
        damp: 0.997,
        roll: 0.02,
        cooldown: 0.45,
        laserPct: 20,
        overMs: 2000,
        chainMs: 600,
        chainStep: 0.5,
        closeCall: 25,
        holoBonus: 500,
        tubeW: 230,
        tubeH: 460,
        shakeEvery: 8,
        shakeMax: 2,
        shakeKick: 520,
        bombEvery: 14,
        bombR: 21,
        bombBlast: 110,
        bombForce: 900,
        bombKill: 3,
        litEvery: 6,
        litSecs: 12,
        litBonus: 15,
        litShove: 150,
        litForce: 750,
        magnetRange: 2.4,
        magnetPull: 1400,
        shinyChance: 0.03,
        shinyPay: 2,
        musicVol: 0.6,
        rankAt: [0, 40, 120, 300, 600, 1000, 1600, 2500, 4000, 6500, 10000],
        radii: [10, 14, 17, 22, 28, 34, 39, 51, 59, 61, 76],
        points: [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66],
        odds: [24, 26, 24, 16, 10]
    },
    // minus ones take points off. win bonus gets divided by how many seconds it took
    solitaire: {
        toFound: 10,
        wasteToTab: 5,
        flipUp: 5,
        foundBack: -15,
        recycleOne: -100,
        recycleThree: -20,
        hintCost: 20,
        timeEvery: 10,
        timeCost: 2,
        winBonus: 700000,
        dealGap: 0.045,
        autoGap: 0.08,
        glitchMin: 1.6,
        glitchMax: 6
    },
    stack: {
        speed: 66,             // how fast it slides in at the start
        speedUp: 1.7,          // added every floor
        speedMax: 270,
        insaneSpeed: 140,      // ultra hardcore starts here
        reach: 74,             // how far it slides each way
        tol: 2,                // how close counts as perfect
        regrowEvery: 4,        // perfects in a row before the top grows back
        leanMax: 22,           // over this and the tower goes
        leanWarn: 15,
        slowMo: 0.33,
        stokeDrain: 0.55,      // how fast holding slow-mo eats the bar
        stokeGain: 0.2,
        feverSecs: 8,
        feverTol: 6,           // in hardcore mode anything this close snaps
        beatWin: 0.07,         // seconds either side of the beat
        specialsFrom: 18,      // ice + heavy slabs from this floor, glitch ones after 30
        beatSync: 1,           // 1 = it crosses the middle on the beat, 0 = old free slide
        musicVol: 0.8
    },
    // files get chucked when you leave a game, keep stays loaded, look = its own colours
    games: [
        { id: 'snake', name: 'SNAKE', jp: 'スネーク', icon: '🐍', keep: ['sprites.js'], files: ['sprites/snake.js', 'snake_app.js'], look: { a: '#39ff88', b: '#1fd8ff', bg: '#020c07' }, best: 'best {n}' },
        { id: 'sweep', name: 'SWEEP', jp: '掃除', icon: '👁', keep: ['games_db.js', 'sprites.js'], files: ['sprites/sweep.js', 'sweep_app.js'], look: { a: '#7dffb0', b: '#ffb547', bg: '#020806' }, best: '{n} cleared' },
        { id: 'flip', name: 'FLIPBOOK', jp: 'パラパラ', icon: '📒', keep: ['games_db.js'], files: ['flip_app.js'], look: { a: '#ff5fa2', b: '#ffd04a', bg: '#0a0710' }, best: '' },
        { id: 'torch', name: 'TORCH', jp: '懐中電灯', icon: '🔦', keep: ['games_db.js'], files: ['torch_app.js'], look: { a: '#ffe08a', b: '#ffffff', bg: '#050407' }, best: '' },
        { id: 'fuse', name: 'CRITICAL FUSE', jp: '臨界融合', icon: '💗', keep: ['games_db.js', 'sprites.js'], files: ['sprites/fuse.js', 'fuse_app.js'], look: { bg: '#07050b' }, best: 'best {n}' },
        { id: 'solitaire', name: 'SOLITAIRE', jp: 'ソリティア', icon: '🃏', keep: ['games_db.js', 'sprites.js'], files: ['sprites/cards.js', 'solitaire_app.js'], look: { bg: '#07050b' }, best: 'best {n}' },
        { id: 'stack', name: 'HARDCORE STACK', jp: '鬼積み', icon: '🛹', keep: ['games_db.js', 'sprites.js'], files: ['sprites/stack.js', 'stack_app.js'], look: { bg: '#07050b' }, best: 'best {n}' },
    ],
    parts: [
        {
            id: 'pt_paper',
            kind: 'paint',
            tool: 'paper',
            name: { jp: '紙の棚', en: 'THE PAPER SHELF' },
            note: {
                jp: 'お絵かきの紙が増える: 縦長(あの小さい長方形)・正方形・漫画原稿',
                en: 'more paper for paint.exe: tall (the little rectangle), square, a manga page'
            }
        },
        {
            id: 'pt_mirror',
            kind: 'paint',
            tool: 'mirror',
            name: { jp: '鏡の間', en: 'HALL OF MIRRORS' },
            note: { jp: '一本描くと、二本、四本、八本。曼荼羅も呪いの紋も、すぐ描ける', en: 'draw once, get 2, 4 or 8. mandalas and hex sigils in seconds' }
        },
        {
            id: 'pt_tone',
            kind: 'paint',
            tool: 'tone',
            name: { jp: 'スクリーントーン', en: 'SCREENTONE' },
            note: { jp: '本物の網点。筆圧で濃くなる。漫画の影はこれ', en: 'real halftone dots. press harder, darker. every manga shadow ever' }
        },
        {
            id: 'pt_sort',
            kind: 'paint',
            tool: 'sort',
            name: { jp: 'データモッシュ', en: 'DATAMOSH' },
            note: { jp: 'ピクセルを、なぞった方向に引きずる。壊れたテープの筆', en: 'drags the pixels the way you drag. a brush made of a broken tape' }
        },
        {
            id: 'pt_fx',
            kind: 'paint',
            tool: 'fx',
            name: { jp: 'フィルター棚', en: 'THE FX RACK' },
            note: { jp: 'レイヤーに一発: 発光・VHS・1bit・色ずれ・反転', en: 'one click on a layer: bloom, VHS, 1-bit, chroma split, invert' }
        },
        {
            id: 'sn_toxic',
            kind: 'snake',
            look: 'toxic',
            a: '#39ff14',
            b: '#b8ff9c',
            name: { jp: '蛇: 毒', en: 'snake: TOXIC' },
            note: { jp: '噛まれたら終わり', en: 'one bite and you\'re done' }
        },
        {
            id: 'sn_blood',
            kind: 'snake',
            look: 'blood',
            a: '#a3001b',
            b: '#4a0009',
            name: { jp: '蛇: 血', en: 'snake: BLOOD' },
            note: { jp: '通った跡が赤い', en: 'leaves a red line' }
        },
        {
            id: 'sn_gold',
            kind: 'snake',
            look: 'gold',
            a: '#f2c14e',
            b: '#9c6b12',
            name: { jp: '蛇: 金', en: 'snake: GOLD' },
            note: { jp: '縁起がいいらしい', en: 'supposed to be lucky' }
        },
        {
            id: 'sn_chrome',
            kind: 'snake',
            look: 'chrome',
            a: '#e8f0ff',
            b: '#8a9bb8',
            name: { jp: '蛇: クローム', en: 'snake: CHROME' },
            note: { jp: '金属の鱗', en: 'metal scales' }
        },
        {
            id: 'sn_sakura',
            kind: 'snake',
            look: 'sakura',
            a: '#ffb7d5',
            b: '#ffe0ee',
            name: { jp: '蛇: 桜', en: 'snake: SAKURA' },
            note: { jp: '可愛い顔して毒がある', en: 'cute face, still venomous' }
        },
        {
            id: 'sw_street',
            kind: 'sweepx',
            name: { jp: '掃除: 通り', en: 'sweep: THE STREET' },
            note: { jp: '16 × 16、カメラ40台', en: '16 × 16, forty cameras' }
        },
        {
            id: 'sw_district',
            kind: 'sweepx',
            name: { jp: '掃除: 地区', en: 'sweep: THE DISTRICT' },
            note: { jp: '30 × 16、カメラ99台', en: '30 × 16, ninety-nine cameras. the big one' }
        },
        {
            id: 'sw_scan',
            kind: 'sweepx',
            name: { jp: '掃除: 探知機', en: 'sweep: SCANNER' },
            note: { jp: '一面に一回、まだ歩いてない安全なマスを開けてくれる', en: 'once a board, it opens somewhere safe you havent walked yet' }
        },
        {
            id: 'sw_sight',
            kind: 'sweepx',
            name: { jp: '掃除: 虫の知らせ', en: 'sweep: SECOND SIGHT' },
            note: { jp: '一面に一回。オンにすると、次に踏んだカメラを目隠ししてくれる', en: 'once a board. switch it on and the next camera you walk into gets taped over in time' }
        },
        {
            id: 'sw_rain',
            kind: 'sweepx',
            name: { jp: '掃除の見え方: 雨', en: 'sweep look: RAIN' },
            note: { jp: '酸性雨がガラスを流れる', en: 'acid rain running down the glass' }
        },
        {
            id: 'sw_print',
            kind: 'sweepx',
            name: { jp: '掃除の見え方: 設計図', en: 'sweep look: BLUEPRINT' },
            note: { jp: '街の設計図の上で', en: 'walk it on the city\'s own plans' }
        },
        {
            id: 'sw_mirror',
            kind: 'sweepx',
            name: { jp: '掃除: 鏡の街', en: 'sweep: MIRROR TOWN' },
            note: { jp: '端と端がつながってる街', en: 'a town where the edges meet' }
        },
        {
            id: 'sx_zen',
            kind: 'snakex',
            name: { jp: '蛇: 凪モード', en: 'snake mode: ZEN' },
            note: {
                jp: '壁なし',
                en: 'no walls, you come out the other side, and biting yourself only costs the tail. it scores a third of what RUN does'
            }
        },
        {
            id: 'sx_rush',
            kind: 'snakex',
            name: { jp: '蛇: 急モード', en: 'snake mode: RUSH' },
            note: { jp: '六十秒。餌はいつも三つ。食べられるだけ食べる', en: 'sixty seconds, three packets on the board at once, as many as you can' }
        },
        {
            id: 'sx_maze',
            kind: 'snakex',
            name: { jp: '蛇: 防火壁モード', en: 'snake mode: FIREWALLS' },
            note: { jp: '十二枚の防火壁。欠片を集めると門が開く', en: 'twelve firewalls in a row. take the shards, the gate opens, go through' }
        },
        {
            id: 'sx_slow',
            kind: 'snakex',
            name: { jp: '蛇の技: 遅', en: 'snake perk: SLOW' },
            note: {
                jp: 'SHIFTを押してる間、時間がゆっくり進む。離すとメーターが回復する',
                en: 'hold SHIFT and time crawls. the meter fills back up when you let go'
            }
        },
        {
            id: 'sx_ghost',
            kind: 'snakex',
            name: { jp: '蛇の技: 霊', en: 'snake perk: GHOST' },
            note: { jp: '一回だけ自分の体をすり抜ける', en: 'once a run you slide straight through yourself' }
        },
        {
            id: 'sx_shield',
            kind: 'snakex',
            name: { jp: '蛇の技: 盾', en: 'snake perk: SHIELD' },
            note: { jp: '一回だけ壁に跳ね返される。死なない', en: 'once a run a wall bounces you back instead of killing you' }
        },
        {
            id: 'sx_magnet',
            kind: 'snakex',
            name: { jp: '蛇の技: 磁', en: 'snake perk: MAGNET' },
            note: { jp: '頭の近くの餌が寄ってくる', en: 'packets near your head drift towards it' }
        },
        {
            id: 'sx_fuse',
            kind: 'snakex',
            name: { jp: '蛇の技: 導火線', en: 'snake perk: LONG FUSE' },
            note: { jp: 'コンボが切れるまで長く待ってくれる', en: 'the combo waits longer before it drops' }
        },
        {
            id: 'sx_luck',
            kind: 'snakex',
            name: { jp: '蛇の技: 運', en: 'snake perk: LUCK' },
            note: { jp: 'お宝が二倍出やすい', en: 'gold turns up twice as often' }
        },
        {
            id: 'sx_slot',
            kind: 'snakex',
            name: { jp: '蛇: 三つ目の枠', en: 'snake: THIRD PERK SLOT' },
            note: { jp: '技を三つ同時に', en: 'three perks at once instead of two' }
        },
        {
            id: 'sx_a_sump',
            kind: 'snakex',
            name: { jp: '蛇の舞台: 澱', en: 'snake arena: THE SUMP' },
            note: { jp: '配管と格子、緑の滴', en: 'pipes and gratings, green drips' }
        },
        {
            id: 'sx_a_lace',
            kind: 'snakex',
            name: { jp: '蛇の舞台: 蝋燭', en: 'snake arena: CANDLELIGHT' },
            note: { jp: '石とレース、揺れる蝋燭', en: 'lace in the stone, candles flickering up top' }
        },
        {
            id: 'sx_a_rain',
            kind: 'snakex',
            name: { jp: '蛇の舞台: 酸性雨', en: 'snake arena: ACID RAIN' },
            note: { jp: '夜の街、窓の灯り、緑の雨', en: 'the city at night, lit windows, green rain' }
        },
        {
            id: 'sx_a_void',
            kind: 'snakex',
            name: { jp: '蛇の舞台: 虚', en: 'snake arena: THE VOID' },
            note: { jp: '星と星雲の中', en: 'out among the stars and the nebula' }
        },
        {
            id: 'sx_ouro',
            kind: 'snakex',
            name: { jp: '蛇: 環モード', en: 'snake mode: OUROBOROS' },
            note: {
                jp: '餌はない。勝手に伸びる。自分の尻尾を捕まえるしかない',
                en: 'no food. you grow on your own. the only way to score is catching your own tail'
            }
        }
    ]
};
