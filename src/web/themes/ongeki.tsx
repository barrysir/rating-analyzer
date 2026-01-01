import { format } from "date-fns";
import { getRegion } from "../../rating/utils";
import { settings } from "../stores/settingsStore";
import { BellLamp, ClearLamp, GradeLamp } from "../../rating/data-types";
import { getPlatinumInformation, getPlatinumStarBorder } from "../../rating/OngekiRefreshCalculator";
import "./ongeki.css";
import { OngekiJudgements } from "../stores/historyStore";

const scoreColors = [
    [0, "text-blue-500"],
    [970000, "text-blue-500"],
    [990000, "text-green-500"],
    [1000000, "text-yellow-500"],
    [1007500, "text-gray-600"],
    [1009000, "text-gray-400"],
    [1010000, "text-stone-500"],
];

const ratingColors = [
    [0, 'text-black'],
    [11.00, "text-red-500"],
    [12.00, "text-orange-500"],
    [13.00, "text-yellow-500"],
    [14.00, "text-green-500"],
    [15.00, 'text-blue-600'],
    [16.00, 'text-indigo-600'],
    // [16.40, 'text-purple-600'],
    // [16.60, 'text-fuchsia-700'],
    // [16.80, 'text-fuchsia-900'],
    [16.20, "text-red-500"],
    [16.40, "text-orange-500"],
    [16.60, "text-yellow-500"],
    [16.80, "text-green-500"],
    [17.00, 'text-slate-500'],
    [17.20, 'text-stone-700'],
    [17.40, 'black'],
];

const frameColors = {
    'total': 'black',
    'best': 'blue',
    'new': 'green',
    'recent': 'red',
    'plat': 'silver',
} as const;

const judgementColors = {
    // crit: '#ffd45e',
    // break: '#ff9500',
    // hit: '#00eaff',
    // miss: '#888',
    crit: '#f0b100',
    break: '#e17100',
    hit: '#00b8db',
    miss: '#4a5565',
    bell: 'oklch(85.2% 0.199 91.936)',
    damage: 'red',
};

export type RefId = {
    scoreId: number;
    calcId?: number;
}

type RefInput = number | RefId;

export function encodeRefId(id?: RefInput): string|undefined {
    if (id === undefined) {
        return undefined;
    }
    if (typeof id === 'number') {
        id = { scoreId: id } as RefId;
    }
    return id.scoreId.toString() + ((id.calcId !== undefined) ? `,${id.calcId}` : "");
}

export function decodeRefId(d: string): RefId | undefined {
    let parts = d.split(',');
    if (parts.length == 1) {
        let scoreId = parseInt(parts[0]!);
        if (isNaN(scoreId)) {
            return undefined;
        }
        return { scoreId };
    } else {
        let scoreId = parseInt(parts[0]!);
        let calcId = parseInt(parts[1]!);
        if (isNaN(scoreId) || isNaN(calcId)) {
            return undefined;
        }
        return { scoreId, calcId };
    }
}

// I don't know if this needs to be a store
// I'll leave it as a plain object for now
export const OngekiTheme = {
    formatRatingText(rating: number) {
        return rating.toFixed(settings.decimalPlaces);
    },

    formatFrameRating(rating: number, frame: keyof typeof frameColors) {
        let color = frameColors[frame];
        return <span style={{'color': color}}>{this.formatRatingText(rating)}</span>;
    },

    formatRating(rating: number, refId?: RefInput) {
        // need to know score id and the calculator (optional; if left out, it fills in the calcIndex for that scoreid)
        let color = getRegion(ratingColors, rating, p => p[0] as number)![1] as string;
        return <span data-rating-tooltip={encodeRefId(refId)} classList={{[color]: true}}>{this.formatRatingText(rating)}</span>;
    },

    formatPlatinumRating(rating: number, refId?: RefInput) {
        return <span data-platinum-tooltip={encodeRefId(refId)}>{this.formatRatingText(rating)}</span>;
    },

    formatJudgements(judges: OngekiJudgements, totalBells: number) {
        let spanColour = (val, color) => <span style={`color: ${color}`}>{val}</span>;
        return <span style="font-weight: bold">{spanColour(judges.cbreak, judgementColors.crit)}-{spanColour(judges.break, judgementColors.break)}-{spanColour(judges.hit, judgementColors.hit)}-{spanColour(judges.miss, judgementColors.miss)} {spanColour(`${judges.bells}/${totalBells}`, judgementColors.bell)} {spanColour(judges.damage, judgementColors.damage)}</span>
    },

    formatChangeRating(change: number) {
        let sign = (change > 0) ? '+' : '';
        return `${sign}${change.toFixed(3)}`;
    },

    formatPoints(points: number, refId?: RefInput) {
        let color = getRegion(scoreColors, points, p => p[0] as number)![1] as string;
        return <span data-judge-tooltip={encodeRefId(refId)} classList={{[color]: true}}>{points}</span>;
    },

    formatPlatinumPercentage(percentage: number) {
        return `${percentage.toFixed(2)}%`;
    },

    formatPlatinum(plat: number, maxPlat: number) {
        let {percentage, stars} = getPlatinumInformation(plat, maxPlat);
        return <div style="display: flex; flex-direction: column;">
            <span>{this.formatPlatinumPercentage(percentage)}</span>
            {this.formatPlatinumStarsWithBorders(stars, plat, maxPlat)}
            <span>{`${plat} / ${maxPlat}`} (-{maxPlat - plat})</span>
        </div>;
    },
    
    formatPlatinumStars(stars: number) {
        let isRainbow = false;
        if (stars == 6) {
            isRainbow = true;
            stars = 5;
        }
        let starDisplay = "★".repeat(stars) + "☆".repeat(5-stars);
        return <span classList={{"rainbow-stars": isRainbow}}>{starDisplay}</span>;
    },

    formatPlatinumStarsWithBorders(stars: number, plat: number, maxPlat: number) {
        let isRainbow = false;
        if (stars == 6) {
            isRainbow = true;
            stars = 5;
        }
        let starDisplay = "★".repeat(stars) + "☆".repeat(5-stars);
        let toPreviousStar = (stars >= 1) ? plat - getPlatinumStarBorder(maxPlat, stars) : null;
        let toNextStar = getPlatinumStarBorder(maxPlat, stars+1) - plat;
        let starBorder;
        if (toPreviousStar === null) {
            starBorder = `(-${toNextStar})`;
        } else {
            starBorder = `(+${toPreviousStar}, -${toNextStar})`;
        }
        return <span><span classList={{"rainbow-stars": isRainbow}}>{starDisplay}</span> {starBorder}</span>;
    },

    formatDate(date: Date) {
        return format(date, "PP");
    },

    formatDateTime(date: Date) {
        return format(date, "PP, pp");
    },

    formatGradeLamp(lamp: GradeLamp) {
        return lamp;
    },

    formatBellLamp(lamp: BellLamp) {
        switch (lamp) {
            case BellLamp.FB: return "FB";   
            case BellLamp.NONE: return "None";
        }
    },

    formatClearLamp(lamp: ClearLamp) {
        switch (lamp) {
            case ClearLamp.NONE: return "None";
            case ClearLamp.FC: return "FC";
            case ClearLamp.AB: return "AB";
            case ClearLamp.ACB: return "AB+";
        }
    },

    frameColors,
};

export type OngekiTheme = typeof OngekiTheme;