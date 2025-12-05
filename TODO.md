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
  * Make rating fixed at 2 decimal places
 * ~~Add a << < [input] > >> below the rating graph to scroll through scores~~
   * [input] can be "1", "50" for score indexes, or "2d", "2h", for dates
   * Also a slider above with an input to go directly to a score index (2175, 780) or date (2024/05/01 or whatever format Javascript will parse)
 * Have a table below with significant events, like "Version Change", maybe "First hit 15.00 rating"
   * Maybe this should be the purpose of the Score Improvements Table? Have a button "Show only significant events"
 * Have a "Max" button somewhere (the Settings?) which lets you load in the frame for max rating
 * Add extra information to FrameRenderers, on rollover will display a popup tooltip window with a table showing something like
     Constant           13.7
     Points 990800      +1.5
     SS Lamp            +1
     Full Bell          +0.5
     no AB Lamp         +0
       Total            16.7
 * Have different background colours for scores which are new
   Yellow for <7 days
   Light yellow for <30 days
   ??
 * Add "optimal" / "best ever" to Recent frame display
 * Reiwa should generate a compatible JSON and link to the relevant image generators
   * I should still have an image generator but...
 * Clicking on song title sends you to youtube link?