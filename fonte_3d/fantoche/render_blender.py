import bpy, math, numpy as np, mathutils, sys, json
ARGS=json.loads(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else {}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='/tmp/claude-0/fant3d/fantoche.glb')
sc=bpy.context.scene
me=[o for o in bpy.data.objects if o.type=='MESH'][0]
# aplica a transformação do import no próprio objeto (para trabalhar em coordenadas do mundo)
mw=me.matrix_world.copy();me.parent=None;me.matrix_world=mw
bpy.context.view_layer.objects.active=me;me.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
CX=-0.03
# ---------- esqueleto ----------
arm_d=bpy.data.armatures.new('rig');arm=bpy.data.objects.new('rig',arm_d);sc.collection.objects.link(arm)
bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
E=arm_d.edit_bones
def osso(n,h,t,pai=None):
    b=E.new(n);b.head=h;b.tail=t
    if pai:b.parent=E[pai]
    return b
osso('raiz',(CX,0,0),(CX,0,.1))
osso('quadril',(CX,0,.10),(CX,0,.22),'raiz')
osso('tronco',(CX,0,.22),(CX,0,.44),'quadril')
osso('cabeca',(CX,0,.44),(CX,0,.85),'tronco')
osso('braco.E',(CX-.15,0,.40),(CX-.25,0,.24),'tronco')
osso('braco.D',(CX+.13,0,.40),(CX+.22,0,.24),'tronco')
osso('perna.E',(CX-.07,0,.16),(CX-.10,0,.0),'quadril')
osso('perna.D',(CX+.06,0,.16),(CX+.08,0,.0),'quadril')
for b in E:b.roll=0
bpy.ops.object.mode_set(mode='OBJECT')
# ---------- pesos (por regiões, com transição suave nas juntas) ----------
V=np.array([tuple(v.co) for v in me.data.vertices]);x=V[:,0]-CX;z=V[:,2]
ss=lambda a,b,t:np.clip((t-a)/(b-a),0,1)**2*(3-2*np.clip((t-a)/(b-a),0,1))
wh=ss(.42,.48,z)
leg=(1-ss(.09,.16,z))*(1-wh)
# braços: pelas PEÇAS do modelo (o Tripo entrega luvas, mangas e ombreiras separadas) — a saia nunca vai junto com o braço
import bmesh
bm=bmesh.new();bm.from_mesh(me.data);bm.verts.ensure_lookup_table()
lab=np.full(len(bm.verts),-1);nl=0
for v0 in bm.verts:
    if lab[v0.index]>=0:continue
    st=[v0];lab[v0.index]=nl
    while st:
        q=st.pop()
        for e in q.link_edges:
            o=e.other_vert(q)
            if lab[o.index]<0:lab[o.index]=nl;st.append(o)
    nl+=1
bm.free()
armw=np.zeros(len(V))
for i in range(nl):
    m=lab==i;c=V[m].mean(0)
    if abs(c[0]-CX)>.11 and .15<c[2]<.46:armw[m]=.55 if c[2]>.37 else 1.0   # ombreiras: meio a meio com o tronco
armw=armw*(1-wh)*(1-leg)
rest=np.clip(1-wh-leg-armw,0,1)
wq=rest*(1-ss(.19,.26,z));wt=rest-wq
lado=ss(-.03,.03,x)   # 0 = lado E (x<CX), 1 = lado D
G={'cabeca':wh,'perna.E':leg*(1-lado),'perna.D':leg*lado,'braco.E':armw*(1-lado),'braco.D':armw*lado,'quadril':wq,'tronco':wt}
for n,w in G.items():
    vg=me.vertex_groups.new(name=n);idx=np.nonzero(w>1e-3)[0]
    for i in idx:vg.add([int(i)],float(w[i]),'REPLACE')
md=me.modifiers.new('arm','ARMATURE');md.object=arm;me.parent=arm
# ---------- contorno (casco invertido: só as costas das faces, em preto) ----------
if ARGS.get('contorno',1):
    mo=bpy.data.materials.new('contorno');mo.use_nodes=True;nt=mo.node_tree;nt.nodes.clear()
    out=nt.nodes.new('ShaderNodeOutputMaterial');mix=nt.nodes.new('ShaderNodeMixShader');geo=nt.nodes.new('ShaderNodeNewGeometry')
    tr=nt.nodes.new('ShaderNodeBsdfTransparent');em=nt.nodes.new('ShaderNodeEmission');em.inputs[0].default_value=(.06,.03,.02,1);em.inputs[1].default_value=1
    lp=nt.nodes.new('ShaderNodeLightPath');mul=nt.nodes.new('ShaderNodeMath');mul.operation='MULTIPLY'
    inv=nt.nodes.new('ShaderNodeMath');inv.operation='SUBTRACT';inv.inputs[0].default_value=1;nt.links.new(geo.outputs['Backfacing'],inv.inputs[1]);nt.links.new(inv.outputs[0],mul.inputs[0]);   # preto = câmera vendo a frente da casca
    nt.links.new(lp.outputs['Is Camera Ray'],mul.inputs[1]);nt.links.new(mul.outputs[0],mix.inputs[0]);   # o contorno só aparece para a câmera (não faz sombra)
    nt.links.new(tr.outputs[0],mix.inputs[1]);nt.links.new(em.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs[0])
    me.data.materials.append(mo)
    so=me.modifiers.new('contorno','SOLIDIFY');so.thickness=ARGS.get('esp',.009);so.use_flip_normals=True;so.material_offset=1;so.offset=1
# ---------- câmera e luz na vista do jogo ----------
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=ARGS.get('zoom',1.32);sc.camera=cam
az,el,r=math.radians(ARGS.get('az',35)),math.radians(ARGS.get('el',22)),6
alvo=mathutils.Vector((CX,0,.47))
cam.location=alvo+mathutils.Vector((r*math.cos(el)*math.sin(az),-r*math.cos(el)*math.cos(az),r*math.sin(el)))
cam.rotation_euler=(alvo-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN');s1=bpy.context.object;s1.data.energy=ARGS.get('sol',4.5);s1.rotation_euler=(math.radians(45),0,math.radians(-35))
bpy.ops.object.light_add(type='SUN');s2=bpy.context.object;s2.data.energy=1.2;s2.rotation_euler=(math.radians(70),0,math.radians(150))
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[1].default_value=ARGS.get('ceu',1.1)
sc.render.engine='CYCLES';sc.cycles.samples=ARGS.get('amostras',24);sc.render.film_transparent=True
R=ARGS.get('res',256);sc.render.resolution_x=sc.render.resolution_y=R
sc.view_settings.view_transform='Standard'
# ---------- poses ----------
PB=arm.pose.bones
for b in PB:b.rotation_mode='XYZ'
# alvos invisíveis: o braço "mira" um ponto (mais confiável que ângulos para socos e guarda)
ALVO={}
for n in ('braco.E','braco.D'):
    e=bpy.data.objects.new('alvo_'+n,None);sc.collection.objects.link(e);ALVO[n]=e
    c=PB[n].constraints.new('DAMPED_TRACK');c.target=e;c.track_axis='TRACK_Y';c.influence=0
def pose(d):
    for b in PB:b.rotation_euler=(0,0,0);b.location=(0,0,0)
    for n,(rx,ry,rz) in d.get('rot',{}).items():PB[n].rotation_euler=(math.radians(rx),math.radians(ry),math.radians(rz))
    for n,l in d.get('loc',{}).items():PB[n].location=l
    for n in ALVO:PB[n].constraints[0].influence=0
    for n,v in d.get('mira',{}).items():ALVO[n].location=(CX+v[0],v[1],v[2]);PB[n].constraints[0].influence=v[3] if len(v)>3 else 1
POSES=json.load(open('/tmp/claude-0/fant3d/poses.json'))
for nome,lista in POSES.items():
    for i,d in enumerate(lista):
        pose(d);bpy.context.view_layer.update()
        sc.render.filepath=f'/tmp/claude-0/fant3d/q/{nome}_{i}.png';bpy.ops.render.render(write_still=True)
