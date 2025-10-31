export function findRegion<T>(arr: T[], val: number, key: (a: T) => number): number | null {
    function myInsert(element: number, array: T[]): number {
        if (array.length === 0)
            return 0;
    
        let start = 0;
        let end = array.length;
    
        while (true) {
            const pivot = (start + end) >> 1;  // should be faster than dividing by 2
            const c = element - key(array[pivot]!);
            if (end - start <= 1) return c < 0 ? pivot : pivot+1;
            
            if (c < 0) {
                end = pivot;
            } else if (c > 0) {
                start = pivot;
            } else {
                return pivot+1;
            }
        }
    }

    let pivot = myInsert(val, arr);
    return (pivot != 0) ? pivot-1 : null;
}
