const PackageJson = require('@npmcli/package-json');

// pre-test script
const main = async () => {
  const pkgJson = await PackageJson.load('./');
  pkgJson.update({ type: 'module' });
  await pkgJson.save();
};

// run pre-test script
main();
