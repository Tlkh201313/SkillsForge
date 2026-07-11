export function phaseAvailability() {
  return {
    capability: 'forge-pipeline',
    activePhase: 2,
    currentPhase: 0
  };
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\\\', '/')}`) {
  console.log(JSON.stringify(phaseAvailability(), null, 2));
}
