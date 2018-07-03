# particle-builder-RK

Tool to automatic builds of particle projects, typically used from Travis, but can also be used locally.

## Running manually

Install dependencies:

```
npm install
```

Create a build.yml file in the target directory. This is typically the top level library or project directory that contains a library.properties file or the project.properties file.

Here's a simple build.yml:

```
- build: examples/1-simple-SpiffsParticleRK
  photon: [0.7.0]
  p1: [latest]
```

This builds the example 1 for the Photon (system firmware 0.7.0) and the p1 (latest release version).

Or, a more complicated example:

```
- build: examples/1-simple-SpiffsParticleRK
  photon: [0.6.3, 0.7.0, 0.8.0-rc.8]
  p1: [0.7.0]
  electron:  [0.6.3, 0.7.0, 0.8.0-rc.8]
- build: examples/2-self-test-SpiffsParticleRK
  photon: [0.7.0]
```

Unlike the default in Travis, this does not default to creating an n x n matrix, as in most cases this just results in a very large number of unnecessary builds. For example, the differences between the Photon and P1 are minimal, so the test coverage of the P1 is reduced in the example above.

Run the build, specifying the path to the source directory you want to build:

```
npm start /Users/rick/Documents/src/SpiffsParticleRK
```

## Running from Travis

The overhead of setting up particle-builder is pretty high because it needs to install the particle-cli package. Instead of doing one platform and one version from each VM spawned by Travis, it runs a bunch of Particle builds from a single Travis VM. This makes sense because the Particle builds are small, and are run from the Particle cloud compiler, anyway, so there are no build artifacts to worry about.

Thus you'll end up having two yml files, one for the Particle build (build.yml) and one for Travis.

