{
  description = "Development environment for tree-sitter-authzed grammar";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core dependencies
            nodejs_20
            tree-sitter
            
            # Rust toolchain for Rust bindings
            rustc
            cargo
            
            # C/C++ toolchain for native bindings
            gcc
            gnumake
            
            # Python for additional tooling
            python3
            
            # Development tools
            nodePackages.eslint
            git
            
            # Build tools
            pkg-config
          ];

          shellHook = ''
            echo "🌳 Tree-sitter Authzed development environment"
            echo "📦 Available commands:"
            echo "  npm install          - Install Node.js dependencies"
            echo "  npm run build        - Generate parser (tree-sitter generate)"
            echo "  npm run test         - Run tree-sitter tests"
            echo "  npm run lint         - Run ESLint"
            echo "  tree-sitter test     - Run parser tests"
            echo "  tree-sitter generate - Generate parser from grammar.js"
            echo "  tree-sitter parse    - Parse files with the grammar"
            echo ""
            echo "🦀 Rust bindings:"
            echo "  cargo build          - Build Rust bindings"
            echo "  cargo test           - Test Rust bindings"
            echo ""
            echo "💡 Quick start:"
            echo "  1. npm install"
            echo "  2. npm run build"
            echo "  3. npm run test"
            
            # Ensure npm dependencies are available
            if [ ! -d "node_modules" ]; then
              echo ""
              echo "📦 Installing npm dependencies..."
              npm install
            fi
          '';

          # Environment variables
          TREE_SITTER_DIR = "${pkgs.tree-sitter}";
          NODE_ENV = "development";
        };

        # Package the grammar itself
        packages.default = pkgs.stdenv.mkDerivation rec {
          pname = "tree-sitter-authzed";
          version = "1.0.0";

          src = ./.;

          nativeBuildInputs = with pkgs; [
            nodejs_20
            tree-sitter
            gcc
            gnumake
          ];

          buildPhase = ''
            # Install npm dependencies
            npm install
            
            # Generate the parser
            npx tree-sitter generate
            
            # Build the parser
            make
          '';

          installPhase = ''
            mkdir -p $out/lib
            mkdir -p $out/share/tree-sitter-grammars
            
            # Install the shared library
            if [ -f "libtree-sitter-authzed.so" ]; then
              cp libtree-sitter-authzed.so $out/lib/
            fi
            
            # Install grammar files
            cp -r queries $out/share/tree-sitter-grammars/
            cp grammar.js $out/share/tree-sitter-grammars/
            cp src/grammar.json $out/share/tree-sitter-grammars/
          '';

          meta = with pkgs.lib; {
            description = "Authzed grammar for tree-sitter";
            homepage = "https://github.com/mleonidas/tree-sitter-authzed";
            license = licenses.mit;
            maintainers = [];
            platforms = platforms.all;
          };
        };

        # Development apps for easy access
        apps = {
          test = flake-utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "test-grammar" ''
              ${pkgs.tree-sitter}/bin/tree-sitter test
            '';
          };
          
          build = flake-utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "build-grammar" ''
              ${pkgs.tree-sitter}/bin/tree-sitter generate
            '';
          };
          
          parse = flake-utils.lib.mkApp {
            drv = pkgs.writeShellScriptBin "parse-file" ''
              if [ $# -eq 0 ]; then
                echo "Usage: $0 <file-to-parse>"
                exit 1
              fi
              ${pkgs.tree-sitter}/bin/tree-sitter parse "$@"
            '';
          };
        };
      });
}