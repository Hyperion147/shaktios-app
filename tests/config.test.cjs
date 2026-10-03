const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('native config retains the microphone prompt without background recording/playback permissions', () => {
  const root = path.resolve(__dirname, '..');
  // Parse locally, suppress raw config/env output, and never call an account/build service.
  const config = JSON.parse(execFileSync(process.execPath, [path.join(root, 'node_modules/expo/bin/cli'), 'config', '--type', 'introspect', '--json'], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, EXPO_NO_DOTENV: '1' },
  }));
  const ios = config._internal.modResults.ios.infoPlist;
  const manifest = config._internal.modResults.android.manifest.manifest;
  const permissions = (manifest['uses-permission'] || []).map((permission) => permission.$['android:name']);
  assert.match(ios.NSMicrophoneUsageDescription || '', /optional voice report/);
  assert.equal((ios.UIBackgroundModes || []).includes('audio'), false);
  assert.ok(permissions.includes('android.permission.RECORD_AUDIO'));
  assert.ok(!permissions.some((permission) => permission.includes('FOREGROUND_SERVICE')));
  assert.equal(config.name, 'ShaktiOS');
  assert.equal(config.userInterfaceStyle, 'light');
  assert.equal(config.android.adaptiveIcon.backgroundColor.toUpperCase(), '#6468F0');
});
