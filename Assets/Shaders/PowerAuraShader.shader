Shader "Scar/PowerAuraShader"
{
    Properties
    {
        _AuraColor ("Aura Color", Color) = (1, 0.15, 0.05, 1)
        _Intensity ("Energy Intensity", Range(0, 5)) = 1.0
        _NoiseScale ("Noise Scale", Float) = 8.0
        _Speed ("Wave Speed", Float) = 2.5
        _FresnelPower ("Fresnel Power", Range(0.5, 6)) = 2.0
    }

    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" "RenderPipeline"="UniversalPipeline" }
        LOD 200

        Pass
        {
            Name "PowerAura"
            Blend One One
            ZWrite Off
            Cull Back

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

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

            CBUFFER_START(UnityPerMaterial)
                float4 _AuraColor;
                float _Intensity;
                float _NoiseScale;
                float _Speed;
                float _FresnelPower;
            CBUFFER_END

            Varyings vert(Attributes input)
            {
                Varyings output;
                float time = _Time.y * _Speed;
                float displacement = sin(input.positionOS.y * _NoiseScale + time) * 0.03 * _Intensity;
                float3 displacedPos = input.positionOS.xyz + input.normalOS * displacement;

                output.positionCS = TransformObjectToHClip(displacedPos);
                output.positionWS = TransformObjectToWorld(displacedPos);
                output.normalWS = normalize(TransformObjectToWorldNormal(input.normalOS));
                output.uv = input.uv;
                return output;
            }

            float4 frag(Varyings input) : SV_Target
            {
                float3 viewDir = normalize(GetCameraPositionWS() - input.positionWS);
                float fresnel = pow(1.0 - saturate(dot(input.normalWS, viewDir)), _FresnelPower);
                float pulse = 0.8 + 0.2 * sin(_Time.y * 6.0);

                float3 color = _AuraColor.rgb * fresnel * _Intensity * pulse * 2.0;
                return float4(color, fresnel * _Intensity);
            }
            ENDHLSL
        }
    }
}
