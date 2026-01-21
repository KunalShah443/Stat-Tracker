# Stat-Tracker: Madden MyCareer Performance Tracker

A cross-platform (iOS/Android/Web) mobile app built with Expo and React Native for tracking Madden NFL MyCareer player stats game-by-game, with automatic analytics and milestone detection.

## MVP Features Implemented

### Core Functionality
- ✅ **Single Player Profile** - Automatically creates "You" as a QB on first launch
- ✅ **Seasons by Year** - Creates current year season on first launch, tied to teams
- ✅ **Game Entry** - Quick form to add games with QB stats (completions, attempts, yards, TDs, INTs, rush stats)
- ✅ **Regular Season vs Postseason** - Separate tracking with togglable flag
- ✅ **Game Logging** - View all games with date, opponent, result, and key stats
- ✅ **Season Stats** - Totals and per-game averages, separated by regular/postseason
- ✅ **Career Stats** - Career totals across all seasons
- ✅ **Milestones** - Auto-detect career thresholds (1K/2K/4K/8K passing yards, 1/10/30/50/100/200 TD milestones)
- ✅ **Streaks** - Current and best streaks for: 2+ pass TD games, no-INT games, 300+ yard games
- ✅ **Offline First** - Full SQLite local storage, no login required

### Architecture
- **Database**: SQLite via `expo-sqlite` with WAL mode for performance
- **Schema**: 
  - `profiles` - Player profiles (extensible for multi-player later)
  - `seasons` - Season records by year
  - `games` - Individual games with metadata
  - `game_stats` - Key-value pairs for flexible stat storage (no schema changes needed for new positions)
- **State Management**: React hooks + local database queries
- **UI**: Tab-based navigation (5 tabs)

## Project Structure

```
src/
├── db/
│   ├── schema.ts          # SQLite schema and table definitions
│   ├── database.ts        # CRUD operations for all entities
│   └── queries.ts         # Stat aggregation and analytics
├── hooks/
│   └── useDatabase.ts     # React hooks for database access
├── types/
│   └── stats.ts           # QB stat types and form types
└── components/
    └── QBStatForm.tsx     # Reusable QB stat entry form

app/
└── (tabs)/
    ├── _layout.tsx        # Tab navigation (5 tabs)
    ├── add-game.tsx       # Add new game screen
    ├── game-logs.tsx      # View games by season
    ├── season-stats.tsx   # Season analytics
    ├── career-stats.tsx   # Career analytics
    └── records.tsx        # Milestones and streaks
```

## QB Stats Tracked

- Pass Completions
- Pass Attempts
- Passing Yards
- Pass TDs
- Interceptions
- Rush Attempts
- Rushing Yards
- Rush TDs

## Navigation (5 Tabs)

1. **Add Game** (Plus icon) - Quick entry form; saves in <60 seconds
2. **Game Logs** (List icon) - View games chronologically with filtering
3. **Season Stats** (Bar chart icon) - Season totals, averages, regular/postseason split
4. **Career Stats** (Line chart icon) - Career totals across all seasons
5. **Records** (Trophy icon) - Milestones and current streaks

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (choose platform)
npm start       # Start Expo dev client
npm run web     # Web version
npm run ios     # iOS simulator
npm run android # Android emulator
```

## Success Criteria Met

✅ Enter a game in under 60 seconds  
✅ Season/career numbers update instantly  
✅ Regular season and postseason stats tracked separately  
✅ App works offline on phone and in browser without login  

## Future Enhancements

### Phase 2
- [ ] Edit/delete games
- [ ] Custom team management
- [ ] Import/export stats
- [ ] Dark mode improvements

### Phase 3
- [ ] Multi-position support (RB, WR, LB, EDGE, CB) - reuses same game_stats schema
- [ ] Accolades tracking (MVP, Super Bowl, All-Pro, etc.)
- [ ] Records engine with custom templates
- [ ] First N games analytics (through 10/25/50/100 games)
- [ ] Comparison to personal pace and best seasons

### Phase 4
- [ ] Cloud sync with user accounts
- [ ] Legends pack dataset for all-time comparisons
- [ ] Advanced analytics and visualization
- [ ] NBA 2K support

## Tech Stack

- **Framework**: Expo / React Native 0.81
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite 16.0)
- **Navigation**: Expo Router 6.0
- **Styling**: React Native StyleSheet
- **State**: React Hooks + Local DB

## Database Schema Notes

The `game_stats` key-value design allows seamless addition of new positions:
- Adding RB? Just store `rush_att`, `rush_yds`, `rush_td` stats
- Adding WR? Store `rec_cmp`, `rec_yds`, `rec_td` stats
- No migration needed; same aggregation engine works for all

---

**Current Version**: 1.0.0-MVP  
**Last Updated**: January 2026
