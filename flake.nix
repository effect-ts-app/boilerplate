{
  description = "Node 24 + pnpm 11 dev shell";

  inputs = {
    # nixos-unstable, not master: same channel the scanner repo tracks, so
    # both dev shells resolve the same nodejs_24. master moves per-commit and
    # drifts repos apart.
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        # keep the existing Nixpkgs lock and use the official security release
        nodeVersion = "24.22.1";
        nodeAssets = {
          x86_64-linux = {
            file = "linux-x64.tar.xz";
            hash = "sha256-bBcqmrZxj3uAH7WnvUhq8u5eMnWAhqBLhPzOKqdwleY=";
          };
          aarch64-linux = {
            file = "linux-arm64.tar.xz";
            hash = "sha256-26v3ocv5R+YFn/rSwnuABB25feoeVTtir97n8T/KM24=";
          };
          x86_64-darwin = {
            file = "darwin-x64.tar.xz";
            hash = "sha256-ZeRQ+Qpuqs1QAPYRhhxM5l+tyH+BN5XcTtDA5fL8otQ=";
          };
          aarch64-darwin = {
            file = "darwin-arm64.tar.xz";
            hash = "sha256-ZUunneYVVkfiIyGTK0Xyocy3BZdswzfJuOJ4vrCFpig=";
          };
        };
        nodeAsset = nodeAssets.${system};
        nodejs = pkgs.stdenv.mkDerivation {
          pname = "nodejs";
          version = nodeVersion;
          src = pkgs.fetchurl {
            url = "https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}-${nodeAsset.file}";
            hash = nodeAsset.hash;
          };
          nativeBuildInputs = pkgs.lib.optionals pkgs.stdenv.isLinux [ pkgs.autoPatchelfHook ];
          buildInputs = pkgs.lib.optionals pkgs.stdenv.isLinux [ pkgs.stdenv.cc.cc.lib ];
          passthru.python = pkgs.python3;
          meta.platforms = builtins.attrNames nodeAssets;
          dontConfigure = true;
          dontBuild = true;
          dontStrip = true;
          installPhase = ''
            runHook preInstall
            mkdir -p "$out"
            cp -R . "$out"
            runHook postInstall
          '';
        };
        # Pin the exact pnpm from package.json's `packageManager` — nixpkgs'
        # pnpm_11 trails npm by weeks, and a devShell pnpm that differs from
        # the one CI/Docker use is how lockfile churn starts.
        # Bump both together; `hash` is the npm tarball's SRI digest:
        #   nix store prefetch-file --json https://registry.npmjs.org/pnpm/-/pnpm-<version>.tgz
        pnpm = pkgs.pnpm_11.override {
          nodejs-slim = nodejs;
          version = "11.20.0";
          hash = "sha256-NOGYyx5DI3UX7O39MfmuJqbAo+U2bOWKLQX0sh+18Zo=";
        };
        python = pkgs.python3.withPackages (ps: [ ps.pymupdf ]);
        java = pkgs.jdk21_headless;
        # keep generated compiler launchers on the patched runtime
        typescript = pkgs.typescript.override {
          buildNpmPackage = pkgs.buildNpmPackage.override { inherit nodejs; };
        };
        tools = with pkgs; [ git java nixfmt nodejs pnpm typescript python ];
      in {
        devShells.default = pkgs.mkShell {
          packages = tools;
        };
      });
}
