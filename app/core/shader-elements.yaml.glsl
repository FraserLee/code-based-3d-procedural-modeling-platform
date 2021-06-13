# a minimal method to test code-based shader generation.
# head, tail might be a useful paradigm sometimes, but suspect dependency-reference will be far more commom in practice

minimal:
  head: |-
    #version 300 es
    precision mediump float;
    out vec4 fragColor;
    void main() {
      fragColor = vec4(
  tail: |-
    , 1.0);
    }