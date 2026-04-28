export function computeStats(votes) {
  const nums = Object.values(votes).filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!nums.length) return null;
  const mean = (nums.reduce((s, v) => s + v, 0) / nums.length).toFixed(1);
  const mid = Math.floor(nums.length / 2);
  const median = nums.length % 2 === 0
    ? ((nums[mid - 1] + nums[mid]) / 2).toFixed(1)
    : String(nums[mid]);
  return {
    mean,
    median,
    range: `${nums[0]}-${nums[nums.length - 1]}`,
    consensus: nums.every((v) => v === nums[0]),
    nums,
  };
}
