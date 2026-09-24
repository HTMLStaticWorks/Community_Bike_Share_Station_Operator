/* ==========================================================================
   SHARED STATION DATA
   Used by the home2 Network Explorer and the Station Map page.
   x / y are percentages on the illustrated city map.
   ========================================================================== */
window.CycleFlowStations = [
  { id: 'cps', name: 'Central Park South',     addr: '59th St & 6th Ave',              hood: 'Midtown',      x: 58, y: 27, cap: 20, classic: 9,  ebike: 3 },
  { id: 'mth', name: 'Midtown Transit Hub',    addr: '42nd St & Park Ave',             hood: 'Midtown',      x: 74, y: 36, cap: 30, classic: 14, ebike: 6 },
  { id: 'chm', name: 'Chelsea Market',         addr: '9th Ave & W 15th St',            hood: 'Chelsea',      x: 30, y: 38, cap: 18, classic: 3,  ebike: 0 },
  { id: 'usq', name: 'Union Square',           addr: 'Broadway & E 14th St',           hood: 'Downtown',     x: 55, y: 48, cap: 24, classic: 5,  ebike: 2 },
  { id: 'evc', name: 'East Village Commons',   addr: 'Avenue A & E 7th St',            hood: 'East Village', x: 82, y: 58, cap: 16, classic: 7,  ebike: 4 },
  { id: 'wsp', name: 'Washington Square Park', addr: 'MacDougal St & Washington Sq S', hood: 'Greenwich',    x: 42, y: 64, cap: 20, classic: 0,  ebike: 0 },
  { id: 'rvp', name: 'Riverside Pier',         addr: 'Hudson Greenway & W 11th St',    hood: 'West Side',    x: 21, y: 58, cap: 22, classic: 11, ebike: 5 },
  { id: 'tbh', name: 'Tribeca Hub',            addr: 'Greenwich St & Chambers St',     hood: 'Tribeca',      x: 34, y: 76, cap: 16, classic: 6,  ebike: 2 },
  { id: 'bpc', name: 'Battery Park City',      addr: 'River Terrace & Vesey St',       hood: 'Battery Park', x: 22, y: 83, cap: 20, classic: 2,  ebike: 0 },
  { id: 'hbp', name: 'Harbor Point',           addr: 'South St & Fulton St',           hood: 'Seaport',      x: 66, y: 80, cap: 18, classic: 8,  ebike: 3 }
];

/* Rider position on the map and the real-world span of the map, for distances */
window.CycleFlowGeo = {
  you: { x: 49, y: 55 },
  miles: { w: 3, h: 2.4 },
  distanceTo(s) {
    const dx = ((s.x - this.you.x) / 100) * this.miles.w;
    const dy = ((s.y - this.you.y) / 100) * this.miles.h;
    return Math.hypot(dx, dy);
  }
};
