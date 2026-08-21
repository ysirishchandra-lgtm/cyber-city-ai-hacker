Shader "Scar/SpeedLinesShader"
{
    Properties
    {
        _LineColor ("Speed Line Color", Color) = (1, 1, 1, 0.8)
        _LineDensity ("Density", Range(10, 100)) = 50.0
        _CenterRadius ("Center Clear Radius", Range(0.1, 0.9)) = 0.45
        _Speed ("Speed", Float) = 15.0
        _Intensity ("Intensity", Range(0, 1)) = 0.0
    }

    SubShader
    {
        Tags { "Queue"="Overlay" "RenderType"="Transparent" "RenderPipeline"="UniversalPipeline" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        Cull Off

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float2 uv         : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv         : TEXCOORD0;
            };

            CBUFFER_START(UnityPerMaterial)
                float4 _LineColor;
                float _LineDensity;
                float _CenterRadius;
                float _Speed;
                float _Intensity;
            CBUFFER_END

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.uv = input.uv;
                return output;
            }

            float rand(float2 co)
            {
                return frac(sin(dot(co.xy ,float2(12.9898,78.233))) * 43758.5453);
            }

            float4 frag(Varyings input) : SV_Target
            {
                if (_Intensity <= 0.001) return float4(0,0,0,0);

                float2 centeredUV = input.uv - 0.5;
                float dist = length(centeredUV);
                float angle = atan2(centeredUV.y, centeredUV.x);

                // Sector noise
                float sector = floor((angle + 3.14159) / (6.28318 / _LineDensity));
                float noise = rand(float2(sector, floor(_Time.y * _Speed)));

                float lineMask = step(0.65, noise);
                float distMask = smoothstep(_CenterRadius, _CenterRadius + 0.35, dist);

                float alpha = lineMask * distMask * _Intensity * _LineColor.a;
                return float4(_LineColor.rgb, alpha);
            }
            ENDHLSL
        }
    }
}
