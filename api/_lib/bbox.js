// Approximate Dartmoor National Park extent, with a small buffer, used to
// spatially pre-filter Strava activities before spending stream-API budget
// on them and to clip GPS tracks to the region.
const DARTMOOR_BBOX = {
  minLat: 50.44,
  maxLat: 50.74,
  minLon: -4.18,
  maxLon: -3.61,
};

function isInBbox(lat, lon) {
  return (
    lat >= DARTMOOR_BBOX.minLat &&
    lat <= DARTMOOR_BBOX.maxLat &&
    lon >= DARTMOOR_BBOX.minLon &&
    lon <= DARTMOOR_BBOX.maxLon
  );
}

module.exports = { DARTMOOR_BBOX, isInBbox };
