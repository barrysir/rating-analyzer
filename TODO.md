 * ~~Frame display~~
 * Slider bar to select score
 * Rename score.score to score.extra
 * Rendering song jackets
 * Fix bug where hot reloading causes .history is null issue
 * Load scores from user input
 * Score improvements table
   * Determine when
     * Max recent increases
       * Theoretical recent too?
     * General frame increases
 * ~~Right-hand side of UI should show tabs~~
 * ~~Fix bug with frames, add regression test~~
 * Reiwa frame rendering
 * ~~Recent frame rendering doesn't have a way to get the corresponding chart~~
   * ~~Not really a good idea to use snapshots since they have a conceptual difference~~
 * ~~Fix score database~~
 * Recent frame by age
 * When frame tab is open when hot reloading, causes it to reprocess for every new score (make score reprocessing loop in a single batch call)
 * Can't drag a region on the graph without changing the score index
 * Rename RecentFrameRenderer prop 'snapshot' to 'frame'
 * Not really a need to snapshot every 100 scores, because a lot of scores do nothing, maybe I can be more efficient
 * Show PBs on songs: all 15+, all 15, all 14+, etc.
 * Standardize spelling of chartId and chartID
 * Refactor getChart, getChartInfo, parseChartId in ChartDb.ts