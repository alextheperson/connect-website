{
  description = "Alexsol.is Website Dev Environment";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = nixpkgs.legacyPackages.${system}; in
        {
          devShells.default = pkgs.mkShell
            {
              packages = with pkgs; [
                nodejs_20
              ];
              shellHook = ''
                echo "Node Initialized!"
                node --version
              '';
            };
        }
      );
}
