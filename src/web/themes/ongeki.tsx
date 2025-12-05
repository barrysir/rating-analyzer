import { format } from "date-fns";
import { getRegion } from "../../rating/utils";
import { settings } from "../stores/settingsStore";

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
} as const;

// I don't know if this needs to be a store
// I'll leave it as a plain object for now
const OngekiTheme = {
    formatRatingText(rating: number) {
        return rating.toFixed(settings.decimalPlaces);
    },

    formatFrameRating(rating: number, frame: keyof typeof frameColors) {
        let color = frameColors[frame];
        // TODO: add scordId to tooltip
        return <span style={{'color': color}}>{this.formatRatingText(rating)}</span>;
    },

    formatRating(rating: number, scoreId?: number) {
        let color = getRegion(ratingColors, rating, p => p[0] as number)![1] as string;
        return <span data-rating-tooltip={(scoreId)?.toString()} classList={{[color]: true}}>{this.formatRatingText(rating)}</span>;
    },

    formatChangeRating(change: number) {
        let sign = (change > 0) ? '+' : '';
        return `${sign}${change.toFixed(3)}`;
    },

    formatPoints(points: number) {
        let color = getRegion(scoreColors, points, p => p[0] as number)![1] as string;
        return <span classList={{[color]: true}}>{points}</span>;
    },

    formatDate(date: Date) {
        return format(date, "PP");
    },

    formatDateTime(date: Date) {
        return format(date, "PP, pp");
    },

    frameColors,
};

export {OngekiTheme};