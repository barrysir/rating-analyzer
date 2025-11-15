import { expect, test } from "bun:test";
import { BestFrame } from "../frames/BestFrame";
import { OngekiRecentFrame } from "../frames/OngekiRecentFrame";

test("undo", () => {
    let c = new BestFrame(30);
    let ratings = [];
    let undos = [];
    for (let i=1; i<=50; i++) {
        ratings.push(c.totalRating);
        undos.push(c.addScore({rating: i}, (i % 10).toString()));
    }

    for (let i=undos.length-1; i>=0; i--) {
        c.undoScore(undos[i]!);
        expect(c.totalRating).toBe(ratings[i]!);
    }
});

test("snapshot", () => {
    let c = new BestFrame(30);
    let ratings = [];

    let scores = [];
    for (let i=1; i<=50; i++) {
        scores.push({
            score: {rating: i},
            chart: (i % 10).toString()
        });
    }

    let snapshot;
    for (let i=0; i<scores.length; i++) {
        let {score,chart} = scores[i]!;
        if (i == 10) {
            snapshot = c.makeSnapshot();   
        }
        c.addScore(score, chart);
        ratings.push(c.totalRating);
    }

    // load the snapshot twice -- if the snapshot memory wasn't copied properly,
    // the snapshot itself could be mutated by the calculations
    // loading it again should cause an error if the snapshot was mutated
    for (let s=0; s<2; s++) {
        c.loadSnapshot(snapshot);
        for (let i=10; i<scores.length; i++) {
            let {score,chart} = scores[i]!;
            c.addScore(score, chart);
            expect(c.totalRating).toBe(ratings[i]!);
        }
    }
});


test("regression-2025-11-13", () => {
    let input = [
    {
        "id": "FestA of PandemoniuM MASTER",
        "score": {
            "points": 1007748,
            "rating": 17.3,
            "score": {
                "id": 2159,
                "timestamp": 1703920442300
            }
        }
    },
    {
        "id": "Regulus MASTER",
        "score": {
            "points": 1007603,
            "rating": 17.2,
            "score": {
                "id": 2006,
                "timestamp": 1700121581100
            }
        }
    },
    {
        "id": "POTENTIAL MASTER",
        "score": {
            "points": 1007635,
            "rating": 17.1,
            "score": {
                "id": 1920,
                "timestamp": 1699415785000
            }
        }
    },
    {
        "id": "宿星審判 MASTER",
        "score": {
            "points": 1007690,
            "rating": 17.1,
            "score": {
                "id": 1909,
                "timestamp": 1699327942000
            }
        }
    },
    {
        "id": "蜘蛛の糸 MASTER",
        "score": {
            "points": 1007620,
            "rating": 16.9,
            "score": {
                "id": 2064,
                "timestamp": 1702706856000
            }
        }
    },
    {
        "id": "the EmpErroR MASTER",
        "score": {
            "points": 1008340,
            "rating": 16.9,
            "score": {
                "id": 1895,
                "timestamp": 1699058178200
            }
        }
    },
    {
        "id": "GAME：CHANGER MASTER",
        "score": {
            "points": 1006235,
            "rating": 16.81,
            "score": {
                "id": 2597,
                "timestamp": 1711952209600
            }
        }
    },
    {
        "id": "Hainuwele MASTER",
        "score": {
            "points": 1008483,
            "rating": 16.8,
            "score": {
                "id": 1941,
                "timestamp": 1699670995100
            }
        }
    },
    {
        "id": "渦状銀河のシンフォニエッタ MASTER",
        "score": {
            "points": 1008273,
            "rating": 16.8,
            "score": {
                "id": 1861,
                "timestamp": 1698821452100
            }
        }
    },
    {
        "id": "Invisible Frenzy MASTER",
        "score": {
            "points": 1003329,
            "rating": 16.62,
            "score": {
                "id": 2636,
                "timestamp": 1713145068500
            }
        }
    },
    {
        "id": "Fragrance EXPERT",
        "score": {
            "points": 1009495,
            "rating": 16.6,
            "score": {
                "id": 2632,
                "timestamp": 1713142189600
            }
        }
    },
    {
        "id": "Scythe of Death MASTER",
        "score": {
            "points": 1002841,
            "rating": 16.580000000000002,
            "score": {
                "id": 2634,
                "timestamp": 1713142655600
            }
        }
    },
    {
        "id": "Zitronectar MASTER",
        "score": {
            "points": 1008597,
            "rating": 16.5,
            "score": {
                "id": 2603,
                "timestamp": 1711957040900
            }
        }
    },
    {
        "id": "BREaK! BREaK! BREaK! MASTER",
        "score": {
            "points": 1008339,
            "rating": 16.5,
            "score": {
                "id": 1981,
                "timestamp": 1700032248000
            }
        }
    },
    {
        "id": "花と、雪と、ドラムンベース。 MASTER",
        "score": {
            "points": 1002195,
            "rating": 16.14,
            "score": {
                "id": 1966,
                "timestamp": 1699951535900
            }
        }
    };

    expect(input).toMatchSnapshot();

    // load calculatoe
    let frame = ...;

    frame.addScore(   {
        "id": "Prominence MASTER",
        "score": {
            "points": 1007429,
            "rating": 16.49,
            "score": {
                "id": 2631,
                "timestamp": 1713141993900
            }
        }
    });

    let undo = {"inserted":9,"removed":{"id":"Prominence MASTER","score":{"points":1007429,"rating":16.49,"score":{"id":2631,"timestamp":1713141993900}}}};

    expect(ongeki.frame.frame).

];


})