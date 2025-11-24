import { ChartDb } from "../rating/chartdb/ChartDb";
import { PersonalBests } from "../rating/PersonalBests";

export function PersonalBestRenderer<Chart, Score>(props: {bests: PersonalBests<Chart, Score>}) {
    let asdf = () => {
        let a = [];
        let e = props.bests.bests.entries();
        for (let i=0; i<10; i++) {
            let val = e.next();
            if (val === undefined) {
                break;
            }
            a.push(val);
        }
        return a;
    }
    return <div>
        
    </div>
}