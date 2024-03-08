import PackageJson from '@npmcli/package-json';

// post-test script
const main = async () => {
  const pkgJson = await PackageJson.load('./');
  pkgJson.update({ type: undefined });
  await pkgJson.save();
};

// run post-test script
main();
