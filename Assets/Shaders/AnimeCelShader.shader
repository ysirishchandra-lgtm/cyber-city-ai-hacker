Shader "Scar/AnimeCelShader"
{
    Properties
    {
        _BaseMap ("Base Texture", 2D) = "white" {}
        _BaseColor ("Base Color", Color) = (1, 1, 1, 1)
        _ShadowColor ("Shadow Color", Color) = (0.35, 0.35, 0.5, 1)
        _ShadowThreshold ("Shadow Threshold", Range(-1, 1)) = 0.0
        _ShadowSoftness ("Shadow Softness", Range(0.001, 0.5)) = 0.05
        _RimColor ("Rim Light Color", Color) = (0, 0.95, 1, 1)
        _RimPower ("Rim Power", Range(0.5, 8.0)) = 3.0
        _RimThreshold ("Rim Threshold", Range(0, 1)) = 0.2
        _OutlineColor ("Outline Color", Color) = (0.05, 0.05, 0.1, 1)
        _OutlineWidth ("Outline Width", Range(0.001, 0.05)) = 0.008
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" "RenderPipeline"="UniversalPipeline" }
        LOD 200

        // ─── PASS 1: Inverted Hull Outline ──────────────────────────────────
        Pass
        {
            Name "Outline"
            Cull Front
            ZWrite On
            ZTest LEqual

            HLSLPROGRAM
            #pragma vertex vertOutline
            #pragma fragment fragOutline
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS   : POSITION;
                float3 normalOS     : NORMAL;
            };

            struct Varyings
            {
                float4 positionCS   : SV_POSITION;
            };

            CBUFFER_START(UnityPerMaterial)
                float4 _OutlineColor;
                float _OutlineWidth;
            CBUFFER_END

            Varyings vertOutline(Attributes input)
            {
                Varyings output;
                float3 normalOS = normalize(input.normalOS);
                float3 extrudedPos = input.positionOS.xyz + normalOS * _OutlineWidth;
                output.positionCS = TransformObjectToHClip(extrudedPos);
                return output;
            }

            float4 fragOutline(Varyings input) : SV_Target
            {
                return _OutlineColor;
            }
            ENDHLSL
        }

        // ─── PASS 2: Cel Shaded Character Surface ───────────────────────────
        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode"="UniversalForward" }
            Cull Back
            ZWrite On

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Attributes
            {
                float4 positionOS   : POSITION;
                float3 normalOS     : NORMAL;
                float2 uv           : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS   : SV_POSITION;
                float3 positionWS   : TEXCOORD1;
                float3 normalWS     : NORMAL;
                float2 uv           : TEXCOORD0;
            };

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);

            CBUFFER_START(UnityPerMaterial)
                float4 _BaseColor;
                float4 _ShadowColor;
                float _ShadowThreshold;
                float _ShadowSoftness;
                float4 _RimColor;
                float _RimPower;
                float _RimThreshold;
            CBUFFER_END

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.positionWS = TransformObjectToWorld(input.positionOS.xyz);
                output.normalWS = normalize(TransformObjectToWorldNormal(input.normalOS));
                output.uv = input.uv;
                return output;
            }

            float4 frag(Varyings input) : SV_Target
            {
                float4 texColor = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, input.uv) * _BaseColor;
                Light mainLight = GetMainLight();
                float3 lightDir = normalize(mainLight.direction);
                float3 normal = normalize(input.normalWS);
                float3 viewDir = normalize(GetCameraPositionWS() - input.positionWS);

                // Stepped Lighting Ramp (Cel Stepping)
                float NdotL = dot(normal, lightDir);
                float lightIntensity = smoothstep(_ShadowThreshold - _ShadowSoftness, _ShadowThreshold + _ShadowSoftness, NdotL);
                float3 diffuseColor = lerp(_ShadowColor.rgb * texColor.rgb, texColor.rgb, lightIntensity);

                // Anime Rim Light
                float NdotV = 1.0 - saturate(dot(normal, viewDir));
                float rimIntensity = pow(NdotV, _RimPower);
                float rimStep = smoothstep(_RimThreshold, _RimThreshold + 0.1, rimIntensity);
                float3 rim = _RimColor.rgb * rimStep;

                float3 finalColor = diffuseColor * mainLight.color + rim;
                return float4(finalColor, 1.0);
            }
            ENDHLSL
        }
    }
    FallBack "Hidden/Universal Render Pipeline/FallbackError"
}
